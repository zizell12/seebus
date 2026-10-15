<?php

return [
    'threshold_hours' => (int) env('REFUND_THRESHOLD_HOURS', 24),
    'percent_before_threshold' => (int) env('REFUND_PERCENT', 75),
    'percent_within_threshold' => (int) env('REFUND_PERCENT_WITHIN_THRESHOLD', 0),
];
