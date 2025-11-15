package com.semes.impresser.generateImage.repository;

import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.CaseBuilder;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.semes.impresser.common.util.S3Util;
import com.semes.impresser.generateImage.dto.response.AllGenerationHistoryResponse;
import com.semes.impresser.generateImage.entity.GenerationStatus;
import com.semes.impresser.generateImage.entity.QGenerationHistory;
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
public class GenerationHistoryRepositoryCustomImpl implements GenerationHistoryRepositoryCustom {

    private final JPAQueryFactory queryFactory;

    QGenerationHistory generationHistory = QGenerationHistory.generationHistory;
    QUser user = QUser.user;

    @Override
    public Page<AllGenerationHistoryResponse> getAllGenerationHistories(Pageable pageable) {

        List<AllGenerationHistoryResponse> generationHistories = queryFactory
            .select(Projections.constructor(AllGenerationHistoryResponse.class,
                generationHistory.uuid,
                generationHistory.bmpKey,
                generationHistory.user.userName,
                generationHistory.user.employeeNo,
                generationHistory.bmpHeight,
                generationHistory.bmpWidth,
                generationHistory.bmpVolume,
                generationHistory.requestedAt,
                generationHistory.completedAt,
                new CaseBuilder()
                    .when(generationHistory.status.eq(GenerationStatus.COMPLETED))
                    .then(true)
                    .otherwise(false)
            ))
            .from(generationHistory)
            .offset(pageable.getOffset())
            .limit(pageable.getPageSize())
            .orderBy(generationHistory.completedAt.desc())
            .fetch();

        Long totalElements = queryFactory
            .select(generationHistory.count())
            .from(generationHistory)
            .fetchOne();

        List<AllGenerationHistoryResponse> converted = generationHistories.stream()
            .map(item -> new AllGenerationHistoryResponse(
                item.generationUuid(),
                S3Util.buildUrlFromKey(item.bmpUrl()),
                item.userName(),
                item.employeeNo(),
                item.bmpHeight(),
                item.bmpWidth(),
                item.bmpVolume(),
                item.requestedAt(),
                item.completedAt(),
                item.isGenerated()
            ))
            .toList();

        return new PageImpl<>(
            converted,
            pageable,
            totalElements == null ? 0 : totalElements
        );
    }

    @Override
    public Page<AllGenerationHistoryResponse> getMyGenerationHistories(UUID userUuid,
        Pageable pageable) {

        List<AllGenerationHistoryResponse> generationHistories = queryFactory
            .select(Projections.constructor(AllGenerationHistoryResponse.class,
                generationHistory.uuid,
                generationHistory.bmpKey,
                generationHistory.user.userName,
                generationHistory.user.employeeNo,
                generationHistory.bmpHeight,
                generationHistory.bmpWidth,
                generationHistory.bmpVolume,
                generationHistory.requestedAt,
                generationHistory.completedAt,
                new CaseBuilder()
                    .when(generationHistory.status.eq(GenerationStatus.COMPLETED))
                    .then(true)
                    .otherwise(false)
            ))
            .from(generationHistory)
            .where(generationHistory.user.uuid.eq(userUuid))
            .orderBy(generationHistory.completedAt.desc())
            .offset(pageable.getOffset())
            .limit(pageable.getPageSize())
            .fetch();

        Long totalElements = queryFactory
            .select(generationHistory.count())
            .from(generationHistory)
            .where(generationHistory.user.uuid.eq(userUuid))
            .fetchOne();

        List<AllGenerationHistoryResponse> converted = generationHistories.stream()
            .map(item -> new AllGenerationHistoryResponse(
                item.generationUuid(),
                S3Util.buildUrlFromKey(item.bmpUrl()),
                item.userName(),
                item.employeeNo(),
                item.bmpHeight(),
                item.bmpWidth(),
                item.bmpVolume(),
                item.requestedAt(),
                item.completedAt(),
                item.isGenerated()
            ))
            .toList();

        return new PageImpl<>(converted, pageable, totalElements == null ? 0 : totalElements);
    }
}
