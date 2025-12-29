package com.finsmart.domain.enums;

/** Types of AI feedback that can be stored. */
public enum AiFeedbackType {
  /** User overrode AI-suggested category */
  CATEGORY_OVERRIDE,

  /** User confirmed or corrected merchant normalization */
  MERCHANT_CONFIRM,

  /** User labeled an anomaly (confirm, snooze, ignore) */
  ANOMALY_LABEL
}
