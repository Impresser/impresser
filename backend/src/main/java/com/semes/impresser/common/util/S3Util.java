package com.semes.impresser.common.util;

public class S3Util {

    /**
     * 파일명 추출
     */
    public static String extractOriginalFileName(String objectName) {
        if (objectName == null || objectName.isEmpty()) {
            return null;
        }
        String fileName = objectName.substring(objectName.lastIndexOf("/") + 1);

        if (fileName.length() > 37) {
            return fileName.substring(37);
        }

        return fileName;
    }
}
