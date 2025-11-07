package com.semes.impresser.common.util;

import java.net.URI;
import java.net.URISyntaxException;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;

public class S3Util {

    private static volatile String DEFAULT_BUCKET;

    public static void setDefaultBucket(String bucket) {
        DEFAULT_BUCKET = bucket;
    }

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

    /**
     * url -> key 추츌
     */
    public static String extractKeyFromUrl(String url) {
        if (url == null || !url.contains("://")) {
            return null;
        }

        try {
            URI uri = new URI(url);
            String path = uri.getPath();
            if (path == null || path.isBlank()) {
                return null;
            }

            String p = path.startsWith("/") ? path.substring(1) : path;
            if (DEFAULT_BUCKET != null && !DEFAULT_BUCKET.isBlank() && p.startsWith(DEFAULT_BUCKET + "/")) {
                return decode(p.substring(DEFAULT_BUCKET.length() + 1));
            }

            int slash = p.indexOf('/');
            if (slash > 0) {
                String host = uri.getHost();
                boolean likelyVirtualHost = (host != null && host.split("\\.").length >= 3);
                if (!likelyVirtualHost) {
                    return decode(p.substring(slash + 1));
                }
            }

            return decode(p);
        } catch (URISyntaxException e) {
            return null;
        }
    }

    private static String decode(String s) {
        return URLDecoder.decode(s, StandardCharsets.UTF_8);
    }

    /**
     * key -> url 변환
     */
    public static String buildUrlFromKey(String endpoint, String key) {
        if (key == null || key.isBlank()) {
            return null;
        }

        String base = (endpoint == null) ? "" : endpoint.trim();
        if (base.endsWith("/")) {
            base = base.substring(0, base.length() - 1);
        }

        String encodedKey = URLEncoder.encode(key, StandardCharsets.UTF_8)
            .replace("+", "%20")
            .replace("%2F", "/");

        StringBuilder sb = new StringBuilder();

        if (!base.isEmpty()) {
            sb.append(base);
        }

        if (DEFAULT_BUCKET != null && !DEFAULT_BUCKET.isBlank()) {
            if (sb.length() > 0) {
                sb.append('/');
            }
            sb.append(DEFAULT_BUCKET);
        }

        if (sb.length() > 0) {
            sb.append('/');
        }
        sb.append(encodedKey);

        return sb.toString();
    }
}
