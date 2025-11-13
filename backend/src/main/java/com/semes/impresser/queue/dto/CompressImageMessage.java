package com.semes.impresser.queue.dto;

import java.io.Serializable;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CompressImageMessage {

    private String inputUrl;
    private String outputUrl;
    private String compressionType;
    private String processingUnit;
    private Integer rowsPerStrip;
    private UUID convertUuid;
    private Auth auth;

    public static CompressImageMessage of(
        Auth auth,
        String inputUrl,
        String outputUrl,
        String compressionType,
        String processingUnit,
        Integer rowsPerStrip,
        UUID convertUuid) {

        return CompressImageMessage.builder()
            .auth(auth)
            .inputUrl(inputUrl)
            .outputUrl(outputUrl)
            .compressionType(compressionType)
            .processingUnit(processingUnit)
            .rowsPerStrip(rowsPerStrip)
            .convertUuid(convertUuid)
            .build();
    }

    @Getter
    @Builder
    public static class Auth {

        private String scheme;
        private String accessToken;

        public static Auth of(String scheme, String accessToken) {
            return Auth.builder()
                .scheme(scheme)
                .accessToken(accessToken)
                .build();
        }
    }
}
