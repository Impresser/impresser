package com.semes.impresser.common.repository;

import java.util.Collections;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;
import org.springframework.stereotype.Repository;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@Repository
public class EmitterRepository {

    private final Map<UUID, Set<SseEmitter>> emitters = new ConcurrentHashMap<>();

    public void add(UUID userUuid, SseEmitter emitter) {
        emitters.computeIfAbsent(userUuid, k -> new CopyOnWriteArraySet<>()).add(emitter);
    }

    public void remove(UUID userUuid, SseEmitter emitter) {
        Set<SseEmitter> userEmitters = emitters.get(userUuid);
        if (userEmitters != null) {
            userEmitters.remove(emitter);
            if (userEmitters.isEmpty()) {
                emitters.remove(userUuid);
            }
        }
    }

    public Set<SseEmitter> getAll(UUID userUuid) {
        return emitters.getOrDefault(userUuid, Collections.emptySet());
    }

}
