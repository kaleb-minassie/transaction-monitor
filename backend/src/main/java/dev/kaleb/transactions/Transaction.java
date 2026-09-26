package dev.kaleb.transactions;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "transactions")
public class Transaction {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) public Long id;
    public String accountId, merchant, category, country, status;
    @Column(precision = 15, scale = 2) public BigDecimal amount;
    @Column(length = 1000) public String reasons;
    public Instant createdAt;
    protected Transaction() {}
    public Transaction(Request input, String status, String reasons) {
        this.accountId=input.accountId(); this.merchant=input.merchant(); this.category=input.category();
        this.country=input.country().toUpperCase(); this.amount=input.amount();
        this.status=status; this.reasons=reasons; this.createdAt=Instant.now();
    }
}
