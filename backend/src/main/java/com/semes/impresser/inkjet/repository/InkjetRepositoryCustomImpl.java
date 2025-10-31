package com.semes.impresser.inkjet.repository;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.semes.impresser.inkjet.dto.response.AllInkjetResponse;
import com.semes.impresser.inkjet.entity.QInkjetPrinter;
import java.time.LocalDate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class InkjetRepositoryCustomImpl implements InkjetRepositoryCustom {

    private final JPAQueryFactory queryFactory;

    QInkjetPrinter inkjetPrinter = QInkjetPrinter.inkjetPrinter;

    @Override
    public Page<AllInkjetResponse> getAllInkjets(String printerName, String printerStatus,
        String processStatus, LocalDate installDate, Pageable pageable) {
        BooleanBuilder builder = new BooleanBuilder();

        Optional.ofNullable(printerName)
            .filter(s -> !s.isBlank())
            .ifPresent(name -> builder.and(
                inkjetPrinter.printerName.containsIgnoreCase(name)));

        Optional.ofNullable(printerStatus)
            .filter(s -> !s.isBlank())
            .ifPresent(status -> builder.and(
                inkjetPrinter.printerStatus.stringValue().containsIgnoreCase(status)));

        Optional.ofNullable(processStatus)
            .filter(s -> !s.isBlank())
            .ifPresent(status -> builder.and(
                inkjetPrinter.processStatus.stringValue().containsIgnoreCase(status)));

        Optional.ofNullable(installDate)
            .ifPresent(install -> builder.and(
                inkjetPrinter.installDate.eq(install)));

        List<AllInkjetResponse> inkjetPrinters = queryFactory
            .select(Projections.constructor(AllInkjetResponse.class,
                inkjetPrinter.uuid,
                inkjetPrinter.printerName,
                inkjetPrinter.modelName,
                inkjetPrinter.printerStatus.stringValue(),
                inkjetPrinter.processStatus.stringValue(),
                inkjetPrinter.installDate
            ))
            .from(inkjetPrinter)
            .where(builder)
            .offset(pageable.getOffset())
            .limit(pageable.getPageSize())
            .orderBy(inkjetPrinter.createdAt.desc())
            .fetch();

        Long totalElements = queryFactory
            .select(inkjetPrinter.count())
            .from(inkjetPrinter)
            .where(builder)
            .fetchOne();

        return new PageImpl<>(inkjetPrinters, pageable, totalElements == null ? 0 : totalElements);
    }
}
