package com.semes.impresser.generateImage.repository;

import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.CaseBuilder;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.semes.impresser.generateImage.dto.response.AllGenerationHistoryResponse;
import com.semes.impresser.generateImage.entity.GenerationStatus;
import com.semes.impresser.generateImage.entity.QGenerationHistory;
import com.semes.impresser.user.entity.QUser;
import java.util.List;
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
                generationHistory.bmpHeight,
                generationHistory.bmpWidth,
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

        return new PageImpl<>(generationHistories, pageable,
            totalElements == null ? 0 : totalElements);
    }
}
