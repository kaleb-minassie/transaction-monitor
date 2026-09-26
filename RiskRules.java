package dev.kaleb.transactions;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class RiskRules {
    public List<String> assess(Request request) {
        List<String> reasons = new ArrayList<>();
        if (request.amount().compareTo(request.threshold()) > 0) reasons.add("Amount exceeds threshold");
        if (!request.country().equalsIgnoreCase("US")) reasons.add("International purchase");
        if (request.category().equalsIgnoreCase("Electronics") &&
            request.amount().compareTo(new BigDecimal("750")) >= 0) reasons.add("High electronics spend");
        return reasons;
    }
}
