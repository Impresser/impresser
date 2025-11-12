package com.semes.impresser.common.client;

import com.semes.impresser.common.client.dto.request.ConvertImageRequest;
import com.semes.impresser.common.client.dto.request.GenerateImageApiRequest;
import com.semes.impresser.common.client.dto.response.ConvertImageResponse;
import com.semes.impresser.common.client.dto.response.GenerateImageApiResponse;
import org.springframework.http.MediaType;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

@Component
public class ExternalApiClient {

    private final RestClient rest;

    public ExternalApiClient(RestClient externalApiRestClient) {
        this.rest = externalApiRestClient;
    }

    public ConvertImageResponse requestConvert(ConvertImageRequest convertImageRequest) {
        ConvertImageResponse convertImageResponse = rest.post()
            .uri("/convert")
            .contentType(MediaType.APPLICATION_JSON)
            .body(convertImageRequest)
            .retrieve()
            .onStatus(HttpStatusCode::isError, (r, res) ->
                new ResponseStatusException(res.getStatusCode(), "API 호출 실패"))
            .body(ConvertImageResponse.class);

        return convertImageResponse;
    }

    public GenerateImageApiResponse requestGenerate(GenerateImageApiRequest generateImageRequest) {

        System.out.println(generateImageRequest);
        GenerateImageApiResponse response = rest.post()
            .uri("/generate")
            .contentType(MediaType.APPLICATION_JSON)
            .body(generateImageRequest)
            .retrieve()
            .onStatus(HttpStatusCode::isError, (r, res) ->
                new ResponseStatusException(res.getStatusCode(), "API 호출 실패"))
            .body(GenerateImageApiResponse.class);

        return response;
    }
}
