package com.semes.impresser.convertImage.repository;

import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.core.types.dsl.NumberExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.semes.impresser.convertImage.entity.QCompressionType;
import com.semes.impresser.convertImage.entity.QConvertHistory;
import com.semes.impresser.dashboard.dto.response.ConvertAvgSpeedListResponse;
import com.semes.impresser.dashboard.dto.response.ConvertHistoryListResponse;
import com.semes.impresser.user.entity.QUser;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class ConvertHistoryRepositoryCustomImpl implements ConvertHistoryRepositoryCustom {

    private final JPAQueryFactory queryFactory;

    private static final QConvertHistory hist = QConvertHistory.convertHistory;
    private static final QCompressionType ctype = new QCompressionType("ctype");
    private static final QUser user = QUser.user;

    @Override
    public Page<ConvertAvgSpeedListResponse> getConvertAvgSpeeds(Pageable pageable) {
        NumberExpression<Double> avgSpeedExpr = hist.avgSpeed.avg();

        List<ConvertAvgSpeedListResponse> content = queryFactory
            .select(Projections.constructor(
                ConvertAvgSpeedListResponse.class,
                ctype.compressionType,
                ctype.processingUnit,
                ctype.version,
                avgSpeedExpr
            ))
            .from(hist)
            .join(hist.compressionType, ctype)
            .groupBy(ctype.compressionType, ctype.processingUnit, ctype.version)
            .orderBy(avgSpeedExpr.desc())
            .offset(pageable.getOffset())
            .limit(pageable.getPageSize())
            .fetch();

        Long total = queryFactory
            .select(ctype.id.countDistinct())
            .from(hist)
            .join(hist.compressionType, ctype)
            .fetchOne();

        return new PageImpl<>(content, pageable, total == null ? 0L : total);
    }

    @Override
    public Page<ConvertHistoryListResponse> getConvertHistories(
        UUID compressionTypeUuid, Pageable pageable) {

        NumberExpression<Long> elapsedTimeExpr = Expressions.numberTemplate(
            Long.class,
            "timestampdiff(SECOND, {0}, {1})",
            hist.requestedAt,
            hist.completedAt
        );

        List<ConvertHistoryListResponse> content = queryFactory
            .select(Projections.constructor(
                ConvertHistoryListResponse.class,
                hist.tiffKey,
                ctype.compressionType,
                ctype.processingUnit,
                ctype.version,
                hist.tiffVolume,
                user.userName,
                hist.avgSpeed,
                elapsedTimeExpr
            ))
            .from(hist)
            .join(hist.compressionType, ctype)
            .join(hist.user, user)
            .where(ctype.uuid.eq(compressionTypeUuid))
            .orderBy(hist.requestedAt.desc())
            .offset(pageable.getOffset())
            .limit(pageable.getPageSize())
            .fetch();

        Long total = queryFactory
            .select(hist.id.count())
            .from(hist)
            .join(hist.compressionType, ctype)
            .where(ctype.uuid.eq(compressionTypeUuid))
            .fetchOne();

        return new PageImpl<>(content, pageable, total == null ? 0L : total);
    }
}
