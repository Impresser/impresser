package com.semes.impresser.queue.producer;

import com.semes.impresser.queue.dto.CompressImageMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ImageMessageProducer {

    private final RabbitTemplate rabbitTemplate;

    @Value("${spring.rabbitmq.compress.exchange}")
    private String compressExchange;

    public void sendToCompressQueue(String routingKey, CompressImageMessage message) {
        rabbitTemplate.convertAndSend(compressExchange, routingKey, message);
    }
}
