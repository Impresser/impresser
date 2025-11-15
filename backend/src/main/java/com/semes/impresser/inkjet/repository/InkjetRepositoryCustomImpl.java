package com.semes.impresser.inkjet.repository;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.DateExpression;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.core.types.dsl.NumberExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.semes.impresser.dashboard.dto.response.InkjetDailyUsageStatResponse;
import com.semes.impresser.inkjet.dto.response.AllInkjetResponse;
import com.semes.impresser.inkjet.dto.response.InkjetResponse;
import com.semes.impresser.inkjet.dto.response.TotalJobResponse;
import com.semes.impresser.inkjet.entity.JobHistory;
import com.semes.impresser.inkjet.entity.QInkjetPrinter;
import com.semes.impresser.inkjet.entity.QJobHistory;
import java.sql.Date;
import java.time.LocalDate;
import java.time.LocalDateTime;
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
public class InkjetRepositoryCustomImpl implements InkjetRepositoryCustom {

    private final JPAQueryFactory queryFactory;

    QInkjetPrinter inkjetPrinter = QInkjetPrinter.inkjetPrinter;
    QJobHistory jobHistory = QJobHistory.jobHistory;

    @Override
    public Page<AllInkjetResponse> getAllInkjets(String printerName, String printerStatus,
        String processStatus, LocalDate installDate, Pageable pageable) {
        BooleanBuilder builder = new BooleanBuilder();
        builder.and(inkjetPrinter.deletedAt.isNull());
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
                inkjetPrinter.installDate,
                inkjetPrinter.canvasX,
                inkjetPrinter.canvasY
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

    @Override
    public InkjetResponse getInkjet(UUID inkjetUuid) {
        InkjetResponse inkjetResponse = queryFactory
            .select(Projections.constructor(
                InkjetResponse.class,
                inkjetPrinter.uuid,
                inkjetPrinter.printerName,
                inkjetPrinter.modelName,
                inkjetPrinter.printerStatus.stringValue(),
                inkjetPrinter.processStatus.stringValue(),
                inkjetPrinter.installDate,
                inkjetPrinter.cpu,
                inkjetPrinter.gpu,
                inkjetPrinter.ram,
                inkjetPrinter.vram,
                jobHistory.sheetCount,
                Expressions.nullExpression(String.class),
                jobHistory.imageKey,
                inkjetPrinter.canvasX,
                inkjetPrinter.canvasY))
            .from(inkjetPrinter)
            .leftJoin(jobHistory).on(inkjetPrinter.uuid.eq(jobHistory.printer.uuid)
                .and(jobHistory.completedAt.isNull()))
            .where(inkjetPrinter.uuid.eq(inkjetUuid))
            .fetchOne();
        return inkjetResponse;
    }

    @Override
    public Page<JobHistory> getJobHistories(UUID inkjetUuid, Pageable pageable) {
        BooleanBuilder builder = new BooleanBuilder();

        builder.and(jobHistory.printer.uuid.eq(inkjetUuid));

        List<JobHistory> jobHistories = queryFactory.selectFrom(jobHistory)
            .where(builder)
            .orderBy(jobHistory.requestedAt.desc())
            .offset(pageable.getOffset())
            .limit(pageable.getPageSize())
            .fetch();

        Long totalElements = queryFactory
            .select(jobHistory.count())
            .from(jobHistory)
            .where(builder)
            .fetchOne();

        return new PageImpl<>(jobHistories, pageable, totalElements == null ? 0 : totalElements);
    }

    @Override
    public TotalJobResponse getTotalJob() {
        LocalDate now = LocalDate.now();
        LocalDateTime startOfDay = now.atStartOfDay();
        LocalDateTime endOfDay = now.plusDays(1).atStartOfDay();

        TotalJobResponse totalJobResponse = queryFactory
            .select(Projections.constructor(TotalJobResponse.class,
                jobHistory.sheetCount.sum(),
                Expressions.constant(now)))
            .from(jobHistory)
            .where(jobHistory.completedAt.between(startOfDay, endOfDay))
            .fetchOne();

        return totalJobResponse;
    }

    @Override
    public List<InkjetDailyUsageStatResponse> getDailyAvgUsage(
        LocalDate startDate,
        LocalDate endDate
    ) {
        DateExpression<Date> jobDate = Expressions.dateTemplate(
            Date.class,
            "date({0})",
            jobHistory.requestedAt
        );

        NumberExpression<Double> usageSecondsExpr = Expressions.numberTemplate(
            Double.class,
            "timestampdiff(SECOND, {0}, {1})",
            jobHistory.requestedAt,
            jobHistory.completedAt
        );

        NumberExpression<Double> avgUsageHoursExpr =
            usageSecondsExpr.avg().divide(3600.0);

        return queryFactory
            .select(Projections.constructor(
                InkjetDailyUsageStatResponse.class,
                jobDate,
                avgUsageHoursExpr
            ))
            .from(jobHistory)
            .where(
                jobDate.goe(Date.valueOf(startDate))
                    .and(jobDate.loe(Date.valueOf(endDate)))
                    .and(jobHistory.completedAt.isNotNull())
            )
            .groupBy(jobDate)
            .orderBy(jobDate.asc())
            .fetch();
    }
}
