package com.featureflags.model.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "targeting_rules")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TargetingRule {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "flag_id", nullable = false)
    private FeatureFlag flag;

    @Column(nullable = false)
    private String attribute;

    @Column(nullable = false)
    private String operator;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String value;

    @Column(name = "rule_value", nullable = false)
    private boolean ruleValue;

    @Column(nullable = false)
    private int priority;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;
}
