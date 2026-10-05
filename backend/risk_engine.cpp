// Transaction risk rules.
// Money is stored in cents: $750.00 = 75000.

// Return flags:
// 0 = approved
// 1 = amount exceeds threshold
// 2 = international purchase
// 4 = high electronics spending
// Multiple flags can be combined.
// -1 = invalid input

extern "C" {

int risk_flags(
    int amountCents,
    int thresholdCents,
    int international,
    int electronics
) {
    if (amountCents <= 0 || thresholdCents <= 0) {
        return -1;
    }

    // These inputs must be either 0 (false) or 1 (true).
    if ((international != 0 && international != 1) ||
        (electronics != 0 && electronics != 1)) {
        return -1;
    }

    int flags = 0;

    if (amountCents > thresholdCents) {
        flags |= 1;
    }

    if (international == 1) {
        flags |= 2;
    }

    if (electronics == 1 && amountCents >= 75000) {
        flags |= 4;
    }

    return flags;
}

// Calculate an illustrative score from 0 to 100.
// This is a weighted rule score, not a fraud probability.
int risk_score(
    int amountCents,
    int thresholdCents,
    int international,
    int electronics
) {
    int flags = risk_flags(
        amountCents,
        thresholdCents,
        international,
        electronics
    );

    if (flags == -1) {
        return -1;
    }

    int score = 0;

    if (flags & 1) {
        score += 40;
    }

    if (flags & 2) {
        score += 35;
    }

    if (flags & 4) {
        score += 25;
    }

    return score;
}

}
