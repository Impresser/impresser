package com.semes.impresser.queue.producer;

import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ConvertProducer {

    private final RabbitTemplate rabbitTemplate;

}
