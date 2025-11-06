package com.semes.impresser.convertImage.repository;

import com.querydsl.jpa.impl.JPAQueryFactory;
import com.semes.impresser.convertImage.entity.QCompressionType;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class CompressionTypeRepositoryCustomImpl implements CompressionTypeRepositoryCustom {

    private final JPAQueryFactory queryFactory;

    private static final QCompressionType ctype = new QCompressionType("ctype");

    @Override
    public List<Integer> findDistinctVersions(String compressionType, String processingUnit) {
        return queryFactory
            .select(ctype.version)
            .from(ctype)
            .where(
                ctype.compressionType.eq(compressionType),
                ctype.processingUnit.equalsIgnoreCase(processingUnit)
            )
            .distinct()
            .orderBy(ctype.version.asc())
            .fetch();
    }
}
