package com.semes.impresser.inkjet.consumer;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class InkjetConsumer {

    @RabbitListener(
        queues = {
            "inkjet-1.print.q",
            "inkjet-2.print.q",
            "inkjet-3.print.q",
            "inkjet-4.print.q",
            "inkjet-5.print.q",
            "inkjet-6.print.q",
            "inkjet-7.print.q",
            "inkjet-8.print.q",
            "inkjet-9.print.q",
            "inkjet-10.print.q"
        },
        containerFactory = "inkjetListenerFactory"
    )
    public void consumePrintMessage(PrintImageMessage message) {
        log.info("Received print message for user: {}, printer: {}",
            message.getUserUuid(), message.getPrinterUuid());
    }
}
