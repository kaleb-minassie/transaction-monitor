package dev.kaleb.transactions;

import static org.junit.jupiter.api.Assertions.*;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

class RiskRulesTest {
    @Test void flagsInternationalHighElectronicsPayment() {
        var input=new Request("acct-1","Shop",new BigDecimal("800"),"Electronics","CA",new BigDecimal("700"));
        assertEquals(3,new RiskRules().assess(input).size());
    }
    @Test void ordinaryPurchaseIsApproved() {
        var input=new Request("acct-1","Market",new BigDecimal("20"),"Groceries","US",new BigDecimal("1000"));
        assertTrue(new RiskRules().assess(input).isEmpty());
    }
}
