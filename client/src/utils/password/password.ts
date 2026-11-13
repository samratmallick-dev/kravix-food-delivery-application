export type PasswordStrengthLabel = "Weak" | "Fair" | "Good" | "Strong";

export interface PasswordStrength {
      /** 0–4, based on length, uppercase, digit and special-character checks. */
      score: number;
      label: PasswordStrengthLabel;
      /** Hex color used for both the meter bar and its label. */
      color: string;
      /** Width of the meter bar as a percentage. */
      percent: number;
}

const LEVELS: PasswordStrength[] = [
      // Any non-empty password below "Fair" should still show a visible weak state.
      { score: 0, label: "Weak", color: "#ef4444", percent: 25 },
      { score: 1, label: "Weak", color: "#ef4444", percent: 25 },
      { score: 2, label: "Fair", color: "#f97316", percent: 50 },
      { score: 3, label: "Good", color: "#eab308", percent: 75 },
      { score: 4, label: "Strong", color: "#22c55e", percent: 100 },
];

export function getPasswordStrength(password: string): PasswordStrength {
      let score = 0;
      if (password.length >= 8) score++;
      if (/[A-Z]/.test(password)) score++;
      if (/\d/.test(password)) score++;
      if (/[^A-Za-z0-9]/.test(password)) score++;

      return LEVELS[score];
}