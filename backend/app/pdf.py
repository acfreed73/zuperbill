# backend/app/pdf.py
from weasyprint import HTML
from pathlib import Path

def generate_invoice_pdf_from_html(invoice_data: dict, signature_base64: str = "", signed_at: str = "", accepted: bool = False):
    template_path = Path(__file__).parent / "templates"
    logo_path = str(template_path / "zuper_blue.png")
    paid_stamp_path = str(template_path / "paid-stamp.png")

    html = f"""
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            @page {{
                margin: 1in;
                @bottom-center {{
                    content: "Page " counter(page) " of " counter(pages);
                    font-size: 0.8em;
                    color: #999;
                }}
            }}
            body {{
                font-family: sans-serif;
                font-size: 13px;
                max-width: 800px;
                margin: auto;
                position: relative;
            }}
            .header {{
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 15px;
            }}
            .logo {{
                height: 60px;
            }}
            .company-details {{
                text-align: right;
                font-size: 0.85em;
            }}
            .invoice-meta {{
                display: flex;
                justify-content: space-between;
                margin-top: 10px;
                gap: 20px;
            }}
            .meta-left, .meta-right {{
                width: 50%;
                font-size: 0.95em;
            }}
            .meta-right {{
                text-align: right;
            }}
            .section {{
                margin-top: 1.2em;
            }}
            table {{
                width: 100%;
                border-collapse: collapse;
                margin-top: 1em;
                font-size: 0.9em;
            }}
            th, td {{
                border: 1px solid #ccc;
                padding: 6px;
                text-align: left;
            }}

            .paid-stamp {{
                position: fixed;
                top: 30%;
                left: 20%;
                width: 60%;
                height: 40%;
                text-align: center;
                background-image: url("file://{paid_stamp_path}");
                background-size: contain;
                background-repeat: no-repeat;
                background-position: center;
                opacity: 0.25;
                transform: rotate(-20deg);
                z-index: 1;
            }}
            .paid-date {{
                position: fixed;
                top: 56%;
                left: 56%;
                transform: translateX(-50%) rotate(-40deg);
                font-size: 22px;
                font-weight: bold;
                color: red;
                opacity: 0.35;
                z-index: 2;
            }}
        </style>
    </head>
    <body>
        {f'<div class="paid-stamp"></div><div class="paid-date">{invoice_data["paid_at"].strftime("%m-%d-%Y")}</div>' if invoice_data.get("paid_at") else ''}

        <div class="header">
            <img src="file://{logo_path}" class="logo" />
            <div class="company-details">
                <strong>Zuper Handy Services</strong><br />
                3907 Cleveland St.<br />
                Skokie IL. 60076<br />
                (847) 271-1468<br />
                billing@zuperhandy.com
            </div>
        </div>

        <div class="invoice-meta">
            <div class="meta-left">
                <strong>Invoice #:</strong> {invoice_data["invoice_number"]}<br />
                <strong>Date:</strong> {invoice_data["date"].strftime("%-m/%-d/%Y")}<br />
                <strong>Status:</strong> {invoice_data["status"]}<br />
                <strong>Payment Type:</strong> {invoice_data.get("payment_type", "N/A")}
            </div>
            <div class="meta-right">
                <strong>Customer:</strong><br />
                {invoice_data["customer"]["first_name"]} {invoice_data["customer"]["last_name"]}<br />
                {invoice_data["customer"]["street"]}<br />
                {invoice_data["customer"]["city"]}, {invoice_data["customer"]["state"]} {invoice_data["customer"].get("zipcode", "")}<br />
                {invoice_data["customer"].get("phone", "")}<br />
                {invoice_data["customer"].get("email", "")}
            </div>
        </div>

        <div class="section">
            <strong>Items:</strong>
            <table>
                <tr><th>Description</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr>
                {''.join(f"<tr><td>{item['description']}</td><td>{item['quantity']}</td><td>${item['unit_price']:.2f}</td><td>${item['quantity'] * item['unit_price']:.2f}</td></tr>" for item in invoice_data["items"])}
            </table>
        </div>

        <div class="section" style="text-align: right;">
            Subtotal: ${invoice_data["total"]:.2f}<br />
            Discount: -${invoice_data.get("discount", 0):.2f}<br />
            Tax: {invoice_data.get("tax", 0):.2f}%<br />
            <strong>Total Due: ${invoice_data["final_total"]:.2f}</strong>
        </div>
        {f'''
        <div class="section">
            <strong>Notes:</strong><br />
            <p>{invoice_data['notes']}</p>
        </div>
        ''' if invoice_data.get("notes") else ""}
        <div class="section">
            <strong>Customer Signature:</strong><br />
            {f'''
            <img src="{signature_base64}" style="height:80px;" /><br />
            <em>Signed and accepted on {signed_at}</em><br />
            <span style="font-size: 11px; color: #555;">
                By signing, you acknowledge work completion and accept our terms.
                <br />
                View terms: <a href="https://zuperhandy.com/terms.html">zuperhandy.com/terms.html</a>
            </span>
            ''' if accepted and signature_base64 else '''
            <div style="height: 80px; border-bottom: 1px solid #000; width: 300px;"></div>
            <span style="font-size: 12px;">(Sign here)</span><br />
            <span style="font-size: 11px; color: #555;">
                By signing, you confirm the work was completed and accept our
                <a href="https://zuperhandy.com/terms.html">Terms & Conditions</a>.
            </span>
        '''}
        </div>

""" + (
        f'''
        <blockquote style="margin-top: 2em; font-style: italic; border-left: 4px solid #ccc; padding-left: 1em;">
            {invoice_data['testimonial']}
            <br />
            &mdash; {invoice_data['customer']['first_name']}
        </blockquote>
        ''' if accepted and invoice_data.get("testimonial") else ""
    ) + """
</body>
</html>
"""

    return HTML(string=html, base_url=str(template_path)).write_pdf()
