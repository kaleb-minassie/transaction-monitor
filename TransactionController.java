package dev.kaleb.transactions;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {
    private final RiskRules rules; private final TransactionRepository repository;
    public TransactionController(RiskRules rules, TransactionRepository repository) { this.rules=rules; this.repository=repository; }

    @PostMapping
    public Transaction create(@Valid @RequestBody Request request) {
        List<String> reasons=rules.assess(request);
        return repository.save(new Transaction(request, reasons.isEmpty()?"APPROVED":"REVIEW", String.join("; ",reasons)));
    }
    @GetMapping public List<Transaction> list() { return repository.findTop50ByOrderByCreatedAtDesc(); }
    @GetMapping("/summary") public Map<String,Long> summary() {
        return Map.of("analyzed",repository.count(),"flagged",repository.countByStatus("REVIEW"));
    }
}
