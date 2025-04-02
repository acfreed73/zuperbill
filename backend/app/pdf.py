from jinja2 import Environment, FileSystemLoader, select_autoescape
from weasyprint import HTML
from pathlib import Path

# Setup Jinja2 environment once
TEMPLATE_DIR = Path(__file__).parent / "templates"
env = Environment(
    loader=FileSystemLoader(TEMPLATE_DIR),
    autoescape=select_autoescape(["html"])
)

def generate_invoice_pdf(invoice_data):
    template = env.get_template("invoice.html")
    html_out = template.render(invoice=invoice_data)
    pdf = HTML(string=html_out, base_url=str(TEMPLATE_DIR)).write_pdf()
    return pdf
