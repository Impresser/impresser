package com.semes.impresser.convertImage.repository;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.core.types.dsl.NumberExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.semes.impresser.convertImage.dto.response.ConvertHistoryDetailResponse;
import com.semes.impresser.convertImage.dto.response.ConvertHistoryItemResponse;
import com.semes.impresser.convertImage.entity.QCompressionType;
import com.semes.impresser.convertImage.entity.QConvertHistory;
import com.semes.impresser.dashboard.dto.response.ConvertAvgSpeedListResponse;
import com.semes.impresser.dashboard.dto.response.ConvertHistoryListResponse;
import com.semes.impresser.user.entity.QUser;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
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
        NumberExpression<Double> avgSpeedExpr = Expressions.numberTemplate(
            Double.class,
            "ROUND(AVG({0}), 2)",
            hist.avgSpeed
        );

        List<ConvertAvgSpeedListResponse> content = queryFactory
            .select(Projections.constructor(
                ConvertAvgSpeedListResponse.class,
                ctype.uuid,
                ctype.compressionType,
                ctype.processingUnit,
                ctype.version,
                avgSpeedExpr
            ))
            .from(hist)
            .join(hist.compressionType, ctype)
            .groupBy(ctype.uuid, ctype.compressionType, ctype.processingUnit, ctype.version)
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

        BooleanBuilder builder = new BooleanBuilder();
        if (compressionTypeUuid != null) {
            builder.and(ctype.uuid.eq(compressionTypeUuid));
        }

        List<ConvertHistoryListResponse> content = queryFactory
            .select(Projections.constructor(
                ConvertHistoryListResponse.class,
                hist.uuid,
                hist.tiffKey,
                ctype.compressionType,
                ctype.processingUnit,
                ctype.version,
                hist.tiffVolume,
                hist.bmpVolume,
                user.userName,
                hist.avgSpeed,
                elapsedTimeExpr,
                hist.compressionRatio
            ))
            .from(hist)
            .join(hist.compressionType, ctype)
            .join(hist.user, user)
            .where(builder)
            .orderBy(hist.requestedAt.desc())
            .offset(pageable.getOffset())
            .limit(pageable.getPageSize())
            .fetch();

        Long total = queryFactory
            .select(hist.id.count())
            .from(hist)
            .join(hist.compressionType, ctype)
            .where(builder)
            .fetchOne();

        return new PageImpl<>(content, pageable, total == null ? 0L : total);
    }

    @Override
    public Page<ConvertHistoryItemResponse> getCompletedHistories(Pageable pageable) {
        NumberExpression<Long> secsExpr = Expressions.numberTemplate(
            Long.class,
            "COALESCE(timestampdiff(SECOND, {0}, {1}), 0)",
            hist.requestedAt, hist.completedAt
        );

        List<ConvertHistoryItemResponse> content = queryFactory
            .select(Projections.constructor(
                ConvertHistoryItemResponse.class,
                hist.uuid,
                hist.tiffKey,
                ctype.processingUnit,
                ctype.compressionType,
                ctype.version,
                hist.bmpVolume,
                hist.tiffVolume,
                hist.compressionRatio,
                user.userName,
                user.employeeNo,
                Expressions.stringTemplate("DATE_FORMAT({0}, '%Y-%m-%dT%H:%i:%s')",
                    hist.completedAt),
                secsExpr,
                hist.tiffKey
            ))
            .from(hist)
            .join(hist.compressionType, ctype)
            .join(hist.user, user)
            .where(hist.completedAt.isNotNull())
            .orderBy(hist.completedAt.desc())
            .offset(pageable.getOffset())
            .limit(pageable.getPageSize())
            .fetch();

        Long total = queryFactory
            .select(hist.id.count())
            .from(hist)
            .join(hist.compressionType, ctype)
            .where(hist.completedAt.isNotNull())
            .fetchOne();

        return new PageImpl<>(content, pageable, total == null ? 0L : total);
    }

    @Override
    public Page<ConvertHistoryItemResponse> getMyCompletedHistories(
        UUID userUuid, Pageable pageable
    ) {
        NumberExpression<Long> secsExpr = Expressions.numberTemplate(
            Long.class,
            "COALESCE(timestampdiff(SECOND, {0}, {1}), 0)",
            hist.requestedAt, hist.completedAt
        );

        List<ConvertHistoryItemResponse> content = queryFactory
            .select(Projections.constructor(
                ConvertHistoryItemResponse.class,
                hist.uuid,
                hist.tiffKey,
                ctype.processingUnit,
                ctype.compressionType,
                ctype.version,
                hist.bmpVolume,
                hist.tiffVolume,
                hist.compressionRatio,
                user.userName,
                user.employeeNo,
                Expressions.stringTemplate("DATE_FORMAT({0}, '%Y-%m-%dT%H:%i:%s')",
                    hist.completedAt),
                secsExpr,
                hist.tiffKey
            ))
            .from(hist)
            .join(hist.compressionType, ctype)
            .join(hist.user, user)
            .where(
                hist.completedAt.isNotNull(),
                user.uuid.eq(userUuid)
            )
            .orderBy(hist.completedAt.desc())
            .offset(pageable.getOffset())
            .limit(pageable.getPageSize())
            .fetch();

        Long total = queryFactory
            .select(hist.id.count())
            .from(hist)
            .join(hist.compressionType, ctype)
            .join(hist.user, user)
            .where(
                hist.completedAt.isNotNull(),
                user.uuid.eq(userUuid)
            )
            .fetchOne();

        return new PageImpl<>(content, pageable, total == null ? 0L : total);
    }

    @Override
    public Optional<ConvertHistoryDetailResponse> getCompletedHistoryDetail(
        UUID convertHistoryUuid) {
        NumberExpression<Long> elapsedSecExpr = Expressions.numberTemplate(
            Long.class,
            "COALESCE(timestampdiff(SECOND, {0}, {1}), 0)",
            hist.requestedAt, hist.completedAt
        );

        NumberExpression<BigDecimal> compressionSecExpr = Expressions.numberTemplate(
            BigDecimal.class, "COALESCE({0}, 0)", hist.compressionTime
        );

        var requestedIsoExpr = Expressions.stringTemplate(
            "DATE_FORMAT({0}, '%Y-%m-%dT%H:%i:%s')", hist.requestedAt
        );
        var completedIsoExpr = Expressions.stringTemplate(
            "DATE_FORMAT({0}, '%Y-%m-%dT%H:%i:%s')", hist.completedAt
        );

        var row = queryFactory
            .select(Projections.constructor(
                ConvertHistoryDetailResponse.class,
                hist.avgGpuUtilization,
                hist.avgSpeed,
                hist.maxSpeed,
                hist.minSpeed,
                requestedIsoExpr,
                completedIsoExpr,
                elapsedSecExpr,
                Expressions.constant("BMP"),
                Expressions.constant("TIFF"),
                compressionSecExpr
            ))
            .from(hist)
            .where(hist.uuid.eq(convertHistoryUuid))
            .fetchOne();

        return Optional.ofNullable(row);
    }
}
