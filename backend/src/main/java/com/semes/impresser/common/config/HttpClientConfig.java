package com.semes.impresser.common.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.ClientHttpRequestFactory;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

@Configuration
public class HttpClientConfig {

    @Value("${external.api.base-url}")
    private String baseUrl;

    @Value("${external.api.connect-timeout-ms:3000}")
    private int connectTimeout;

    @Value("${external.api.read-timeout-ms:5000}")
    private int readTimeout;

    @Bean
    public RestClient externalApiRestClient(RestClient.Builder builder) {
        return builder
            .baseUrl(baseUrl)
            .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
            .requestFactory(clientHttpRequestFactory())
            .build();
    }

    private ClientHttpRequestFactory clientHttpRequestFactory() {
        SimpleClientHttpRequestFactory f = new SimpleClientHttpRequestFactory();
        f.setConnectTimeout(connectTimeout);
        f.setReadTimeout(readTimeout);
        return f;
    }
}
