package dev.kaleb.transactions;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

// Validation prevents invalid payments from reaching the rule engine.
public record Request(@NotBlank String accountId, @NotBlank String merchant,
                      @NotNull @DecimalMin("0.01") BigDecimal amount,
                      @NotBlank String category, @NotBlank String country,
                      @NotNull @DecimalMin("0.01") BigDecimal threshold) {}
