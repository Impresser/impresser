package com.semes.impresser.common.config;

import java.util.ArrayList;
import java.util.List;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Declarable;
import org.springframework.amqp.core.Declarables;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.ExchangeBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.annotation.EnableRabbit;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.connection.CachingConnectionFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitAdmin;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableRabbit
public class RabbitMQConfig {

    @Value("${spring.rabbitmq.host}")
    private String rabbitmqHost;

    @Value("${spring.rabbitmq.port}")
    private int rabbitmqPort;

    @Value("${spring.rabbitmq.username}")
    private String rabbitmqUsername;

    @Value("${spring.rabbitmq.password}")
    private String rabbitmqPassword;

    public static final String DLX = "dlx.topic";
    public static final String DLQ = "tasks.dlq";
    public static final String COMPRESS_EX = "compress.direct";
    public static final int N_SHARDS = 32;
    public static final String PRINT_EX = "print.direct";
    public static final int INKJET_COUNT = 10;

    /**
     * rabbitMQ 서버와 커넥션 관리하는 ConnectionFactory 생성
     */
    @Bean
    public ConnectionFactory connectionFactory() {
        CachingConnectionFactory cachingConnectionFactory = new CachingConnectionFactory(
            rabbitmqHost, rabbitmqPort);

        cachingConnectionFactory.setUsername(rabbitmqUsername);
        cachingConnectionFactory.setPassword(rabbitmqPassword);
        return cachingConnectionFactory;
    }

    /**
     * Spring에서 큐, 익스체인지, 바인딩을 자동으로 생성
     */
    @Bean
    public RabbitAdmin rabbitAdmin(ConnectionFactory connectionFactory) {
        return new RabbitAdmin(connectionFactory);
    }

    /**
     * Json 직렬화/역직렬화 메세지를 자동으로 객체 <-> Json 변환
     */
    @Bean
    public Jackson2JsonMessageConverter messageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    /**
     * 메세지 발행용 RabbitTemplate 생성 메세지를 Json 변환기로 변환하여 전송
     */
    @Bean
    public RabbitTemplate rabbitTemplate(
        ConnectionFactory connectionFactory,
        Jackson2JsonMessageConverter jackson2JsonMessageConverter) {
        RabbitTemplate rabbitTemplate = new RabbitTemplate(connectionFactory);
        rabbitTemplate.setMessageConverter(jackson2JsonMessageConverter);
        return rabbitTemplate;
    }

    /**
     * RabbitMQ 리스너 컨테이너 기본 설정 concurrentConsumers: 초기 컨슈머 수 1 → 직렬 처리 maxConcurrentConsumers: 최대
     * 컨슈머 4 → 필요 시 확장 가능 prefetchCount: 한 번에 한 메시지씩 가져오기 → 순서 보장
     */
    @Bean(name = "compressListenerFactory")
    public SimpleRabbitListenerContainerFactory compressListenerFactory(
        ConnectionFactory connectionFactory,
        Jackson2JsonMessageConverter jackson2JsonMessageConverter
    ) {
        SimpleRabbitListenerContainerFactory containerFactory = new SimpleRabbitListenerContainerFactory();
        containerFactory.setConnectionFactory(connectionFactory);
        containerFactory.setMessageConverter(jackson2JsonMessageConverter);
        containerFactory.setConcurrentConsumers(2);
        containerFactory.setMaxConcurrentConsumers(8);
        containerFactory.setPrefetchCount(2);
        return containerFactory;
    }

    @Bean(name = "inkjetListenerFactory")
    public SimpleRabbitListenerContainerFactory inkjetListenerFactory(
        ConnectionFactory connectionFactory,
        Jackson2JsonMessageConverter jackson2JsonMessageConverter
    ) {
        SimpleRabbitListenerContainerFactory containerFactory = new SimpleRabbitListenerContainerFactory();
        containerFactory.setConnectionFactory(connectionFactory);
        containerFactory.setMessageConverter(jackson2JsonMessageConverter);
        containerFactory.setConcurrentConsumers(1);
        containerFactory.setMaxConcurrentConsumers(1);
        containerFactory.setPrefetchCount(1);
        return containerFactory;
    }

    /**
     * DLX(Dead Letter Exchange) 생성 실패 메시지를 받을 때 사용 durable=true → 서버 재시작 후 유지
     */
    @Bean
    public TopicExchange dlx() {
        return ExchangeBuilder.topicExchange(DLX).durable(true).build();
    }

    /**
     * DLQ(Dead Letter Queue) 생성 실패 메시지를 저장
     */
    @Bean
    public Queue dlq() {
        return QueueBuilder.durable(DLQ).build();
    }

    /**
     * DLX와 DLQ를 바인딩 라우팅키 # → 모든 DLX 메시지를 DLQ로 전달
     */
    @Bean
    public Binding dlqBinding(TopicExchange dlx, Queue dlq) {
        return BindingBuilder.bind(dlq).to(dlx).with("#");
    }

    /**
     * 압축용 DirectExchange 생성 샤드 큐 라우팅에 사용
     */
    @Bean
    public DirectExchange compressExchange() {
        return ExchangeBuilder.directExchange(COMPRESS_EX).durable(true).build();
    }

    /**
     * 샤드 큐 32개 생성 각 큐는 DLX 연결 DirectExchange와 라우팅키 "compress.shard.i"로 바인딩 Declarables → 한 번에 큐+바인딩
     * 등록
     */
    @Bean
    public Declarables compressShardTopology(@Qualifier("compressExchange") DirectExchange compressEx) {
        List<Declarable> declarations = new ArrayList<>();
        for (int i = 0; i < N_SHARDS; i++) {
            String queueName = "compress.shard." + i;
            Queue queue = QueueBuilder.durable(queueName)
                .withArgument("x-dead-letter-exchange", DLX)
                .build();
            Binding binding = BindingBuilder.bind(queue).to(compressEx).with(queueName);

            declarations.add(queue);
            declarations.add(binding);
        }
        return new Declarables(declarations);
    }

    /**
     * 설비용 DirectExchange 생성
     */
    @Bean
    public DirectExchange printExchange() {
        return ExchangeBuilder.directExchange(PRINT_EX).durable(true).build();
    }

    /**
     * 설비별 큐 10개 생성
     * 각 큐는 DLX 연결
     * DirectExchange와 설비별 라우팅키(equip-i)로 바인딩
     * 컨슈머는 동시성 1로 순차 처리
     */
    @Bean
    public Declarables printTopology(@Qualifier("printExchange") DirectExchange printEx) {
        List<Declarable> declarations = new ArrayList<>();
        for (int i = 1; i <= INKJET_COUNT; i++) {
            String queueName = "inkjet-" + i + ".print.q";
            String routingKey = "inkjet-" + i;
            Queue queue = QueueBuilder.durable(queueName)
                .withArgument("x-dead-letter-exchange", DLX)
                .build();
            Binding binding = BindingBuilder.bind(queue).to(printEx).with(routingKey);
            declarations.add(queue);
            declarations.add(binding);
        }
        return new Declarables(declarations);
    }
}
