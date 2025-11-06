package com.semes.impresser.convertImage.repository;

import java.util.List;

public interface CompressionTypeRepositoryCustom {

    List<Integer> findDistinctVersions(String compressionType, String processingUnit);
}
