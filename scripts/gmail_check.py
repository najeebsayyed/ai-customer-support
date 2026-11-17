from app.gmail import Gmail, get_body, get_headers

gmail = Gmail()
print("Connected as", gmail.address)

message_ids = gmail.list_new_message_ids(max_results=1)
if not message_ids:
    print("No new unhandled messages found in inbox.")
else:
    message_id = message_ids[0]
    message = gmail.get_message(message_id)
    headers = get_headers(message)
    print(headers.get("from"), "|", headers.get("subject"))
    print(get_body(message)[:500])

    gmail.send_reply(message, "Thanks, we received your email.")
    print("Reply sent")