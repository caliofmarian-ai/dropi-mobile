from pathlib import Path

for relative in [
    "tests/auth.forgot-password.test.ts",
    "tests/test-account-auth-recovery-379-contract.test.ts",
]:
    path = Path(relative)
    text = path.read_text()
    text = text.replace(
        "If this email is registered, a 6-digit code has been sent.",
        "If this account is registered, a 6-digit code has been sent.",
    )
    text = text.replace(
        "Always return success to prevent email enumeration",
        "Always return generic success to prevent account enumeration",
    )
    path.write_text(text)
