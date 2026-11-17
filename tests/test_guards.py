from app.guards import skip_reason


def test_skip_reason_normal_message_allowed():
    message = {"labelIds": ["INBOX"]}
    headers = {
        "from": "Customer <customer@example.com>",
        "subject": "Question about paddle boards",
    }
    assert skip_reason(message, headers, "support@harborandpine.com") is None


def test_skip_reason_sent_by_us():
    message = {"labelIds": ["SENT", "INBOX"]}
    headers = {"from": "support@harborandpine.com"}
    assert skip_reason(message, headers, "support@harborandpine.com") == "sent by us"


def test_skip_reason_from_own_address():
    message = {"labelIds": ["INBOX"]}
    headers = {"from": "Harbor & Pine <support@harborandpine.com>"}
    assert skip_reason(message, headers, "support@harborandpine.com") == "from our own address"


def test_skip_reason_auto_submitted():
    message = {"labelIds": ["INBOX"]}
    headers = {
        "from": "mailer-daemon@example.com",
        "auto-submitted": "auto-replied",
    }
    assert skip_reason(message, headers, "support@harborandpine.com") == "auto-submitted: auto-replied"


def test_skip_reason_bulk_and_list_precedence():
    message = {"labelIds": ["INBOX"]}
    for prec in ["bulk", "list", "junk"]:
        headers = {
            "from": "newsletter@promo.com",
            "precedence": prec,
        }
        assert skip_reason(message, headers, "support@harborandpine.com") == "bulk or list mail"
