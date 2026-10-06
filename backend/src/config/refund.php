<?php

return [
    'mode' => env('REFUND_MODE', 'kebijakan'),
    'policy_percent' => (int) env('REFUND_POLICY_PERCENT', 75),
    'policy_window_hours' => (int) env('REFUND_POLICY_WINDOW_HOURS', 24),
    'full_refund_percent' => (int) env('REFUND_FULL_PERCENT', 100),
];
