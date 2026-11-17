from app.ai.rules import next_step, resolve_issue
from app.ai.schemas import Issue


def test_paddle_board_missing_accessory():
    issue = Issue(
        product="paddle-board",
        problem="missing-accessory",
        order_number="ORD-12345",
    )
    assert next_step(issue) == "ship-part"
    assert resolve_issue(issue) == "ship-part"


def test_paddle_board_missing_accessory_without_order_number():
    issue = Issue(
        product="paddle-board",
        problem="missing-accessory",
    )
    assert next_step(issue) == "ship-part"
    assert resolve_issue(issue) == "ask-details"


def test_paddle_board_slow_leak_valve_not_checked():
    issue = Issue(
        product="paddle-board",
        problem="slow-leak",
        valve_checked=False,
    )
    assert next_step(issue) == "valve-check"
    assert resolve_issue(issue) == "valve-check"


def test_paddle_board_slow_leak_under_30_days():
    issue = Issue(
        product="paddle-board",
        problem="slow-leak",
        valve_checked=True,
        days_since_delivery=14,
        order_number="ORD-999",
    )
    assert next_step(issue) == "new-board"
    assert resolve_issue(issue) == "new-board"


def test_paddle_board_slow_leak_over_30_days():
    issue = Issue(
        product="paddle-board",
        problem="slow-leak",
        valve_checked=True,
        days_since_delivery=45,
        order_number="ORD-999",
    )
    assert next_step(issue) == "patch-kit"
    assert resolve_issue(issue) == "patch-kit"


def test_shelving_missing_hardware():
    issue = Issue(
        product="shelving",
        problem="missing-hardware",
        order_number="ORD-SHELF-1",
    )
    assert next_step(issue) == "ship-hardware-kit"
    assert resolve_issue(issue) == "ship-hardware-kit"


def test_shelving_damaged_panels_two_or_fewer():
    issue = Issue(
        product="shelving",
        problem="damaged-panels",
        part_numbers=["HP-S3-01", "HP-S3-02"],
        order_number="ORD-SHELF-2",
    )
    assert next_step(issue) == "ship-panels"
    assert resolve_issue(issue) == "ship-panels"


def test_shelving_damaged_panels_more_than_two():
    issue = Issue(
        product="shelving",
        problem="damaged-panels",
        part_numbers=["HP-S3-01", "HP-S3-02", "HP-S3-03"],
        order_number="ORD-SHELF-3",
    )
    assert next_step(issue) == "full-replacement"
    assert resolve_issue(issue) == "full-replacement"


def test_seam_split_escalates():
    issue = Issue(
        product="paddle-board",
        problem="seam-split",
    )
    assert next_step(issue) == "escalate"
    assert resolve_issue(issue) == "escalate"
