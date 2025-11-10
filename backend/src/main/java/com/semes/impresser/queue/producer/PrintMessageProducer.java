package com.semes.impresser.queue.producer;

import com.semes.impresser.queue.dto.PrintMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PrintMessageProducer {

    private final RabbitTemplate rabbitTemplate;

    @Value("${spring.rabbitmq.print.exchange}")
    private String compressExchange;

    public void sendPrintMessage(String routingKey, PrintMessage message) {
        rabbitTemplate.convertAndSend(compressExchange, routingKey, message);
    }
}
