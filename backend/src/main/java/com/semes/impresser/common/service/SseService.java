package com.semes.impresser.common.service;

import com.semes.impresser.common.repository.EmitterRepository;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@Slf4j
@Service
@RequiredArgsConstructor
public class SseService {

    private final EmitterRepository sseEmitterRepository;
    private static final long DEFAULT_TIMEOUT = 15 * 60 * 1000L;

    public SseEmitter subscribe(UUID userUuid) {
        SseEmitter emitter = new SseEmitter(DEFAULT_TIMEOUT);
        sseEmitterRepository.add(userUuid, emitter);

        emitter.onCompletion(() -> sseEmitterRepository.remove(userUuid, emitter));
        emitter.onTimeout(() -> sseEmitterRepository.remove(userUuid, emitter));
        emitter.onError(e -> sseEmitterRepository.remove(userUuid, emitter));

        sendInitAndPing(emitter, userUuid);
        return emitter;
    }

    public void sentToClient(UUID userUuid, String eventName, Object data) {
        Collection<SseEmitter> emitters = sseEmitterRepository.getAll(userUuid);
        if (emitters.isEmpty()) {
            return;
        }

        String eventId = userUuid + "_" + System.currentTimeMillis();
        log.debug("[SSE] send start: userId={}, eventId={}, targets={}",
            userUuid, eventId, emitters.size());

        for (SseEmitter emitter : new ArrayList<>(emitters)) {
            try {
                emitter.send(SseEmitter.event()
                    .name(eventName)
                    .id(eventId)
                    .data(data));
                log.debug("[SSE] sent eventName={} to emitter={}",
                    eventName, System.identityHashCode(emitter));
            } catch (IOException e) {
                log.warn("[SSE] send failed: eventName={}, emitter={}, e={}",
                    eventName, System.identityHashCode(emitter), e.getMessage());
                sseEmitterRepository.remove(userUuid, emitter);
            }
        }
    }

    private void sendInitAndPing(SseEmitter emitter, UUID userUuid) {
        try {
            emitter.send(SseEmitter.event()
                .name("INIT")
                .id(userUuid + "_init_" + System.currentTimeMillis())
                .data("ok"));

            emitter.send(SseEmitter.event()
                .name("PING")
                .id(userUuid + "_ping_" + System.currentTimeMillis())
                .data("ping"));
        } catch (IOException e) {
            log.warn("[SSE] 초기 메시지 전송 실패: userUuid={}, ex={}", userUuid, e.getMessage());
            sseEmitterRepository.remove(userUuid, emitter);
            emitter.completeWithError(e);
        }
    }
}
