"""The gym's information that can change (plans, prices, hours, contact…), from the db/ folder at the root of the repo.

The website reads the same files, so they're edited in one place. instructions.md and knowledge/ use them through
{{PLACEHOLDERS}}, filled in by fill(). Read once, when the server starts.
"""

import json
import re
from pathlib import Path

from .spanish import WEEKDAYS

# Next to assistant/, in the repo and in the Docker image.
DB_DIR = Path(__file__).resolve().parent.parent.parent / "db"


def load(name: str):
    return json.loads((DB_DIR / f"{name}.json").read_text())


GYM = load("gimnasio")
SCHEDULE = load("horarios")
PLANS = load("planes")
FAQS = load("preguntas")
TEAM = load("equipo")
TEXTS = load("textos")
CAREER = load("trayectoria")


def join(items: list[str], last: str = "y") -> str:
    """'a, b y c'."""
    return f"{', '.join(items[:-1])} {last} {items[-1]}" if len(items) > 1 else "".join(items)


def clock(time: str) -> str:
    """'08:00' → '8:00'."""
    return time.removeprefix("0")


def minutes(time: str) -> int:
    hours, mins = time.split(":")
    return int(hours) * 60 + int(mins)


def plural(day: str) -> str:
    """'sábado' → 'sábados'; 'lunes' stays 'lunes'."""
    return day if day.endswith("s") else f"{day}s"


def plain(text: str) -> str:
    """The text without the website's *italics* and **bold**."""
    return re.sub(r"\*+([^*]+)\*+", r"\1", text)


def money(price: dict) -> str:
    """'ARS 450.000'."""
    return f"{price['moneda']} {price['monto']:,}".replace(",", ".")


# The opening hours.
SHIFTS = SCHEDULE["turnos"]


def days() -> str:
    """'de lunes a viernes', or 'los lunes, miércoles y viernes' when the days aren't in a row."""
    open_days = SCHEDULE["dias"]
    numbers = [WEEKDAYS.index(day) for day in open_days]
    if len(numbers) > 2 and numbers == list(range(numbers[0], numbers[0] + len(numbers))):
        return f"de {open_days[0]} a {open_days[-1]}"
    return f"los {join([plural(day) for day in open_days])}"


def closed_days() -> str:
    """'sábados, domingos ni feriados'."""
    closed = [plural(day) for day in WEEKDAYS if day not in SCHEDULE["dias"]]
    if not SCHEDULE["abreLosFeriados"]:
        closed.append("feriados")
    return join(closed, "ni")


def start_times() -> str:
    """'entre las 8:00 y las 11:00, o entre las 14:30 y las 20:00': when a training or a visit can start."""
    return ", o ".join(f"entre las {clock(shift['abre'])} y las {clock(shift['ultimoIngreso'])}" for shift in SHIFTS)


def example_outside_hours() -> str:
    """'para las 13:00, ofrecé las 11:00 o las 14:30': a time between two shifts, and the closest ones that work."""
    if len(SHIFTS) > 1:
        last_entry, opens = SHIFTS[0]["ultimoIngreso"], SHIFTS[1]["abre"]
        hour = round((minutes(last_entry) + minutes(opens)) / 2 / 60)
        return f"para las {hour}:00, ofrecé las {clock(last_entry)} o las {clock(opens)}"
    opens = SHIFTS[0]["abre"]
    return f"para las {minutes(opens) // 60 - 1}:00, ofrecé las {clock(opens)}"


def shifts() -> str:
    """'Mañana de 8:00 a 12:00 (último ingreso a las 11:00). Tarde de …'."""

    def part_of_day(time: str) -> str:
        return "Mañana" if minutes(time) < 12 * 60 else "Tarde" if minutes(time) < 20 * 60 else "Noche"

    return " ".join(
        f"{part_of_day(shift['abre'])} de {clock(shift['abre'])} a {clock(shift['cierra'])} "
        f"(último ingreso a las {clock(shift['ultimoIngreso'])})."
        for shift in SHIFTS
    )


def class_length() -> str:
    """'1 hora y 20 minutos'."""
    hours, mins = divmod(SCHEDULE["minutosPorClase"], 60)
    parts = [f"{hours} hora{'s' if hours > 1 else ''}"] if hours else []
    return " y ".join(parts + ([f"{mins} minutos"] if mins else []))


def plan_prices(plan: dict) -> str:
    """'ARS 450.000 por mes, o USD 300 por mes'."""
    return ", o ".join(f"{money(price)} {plan['periodo']}" for price in plan["precios"])


def plan_section(plan: dict) -> str:
    """A plan's section of the gym's information: what it is, its price, what it includes and its details."""
    lines = [
        f"## {plan.get('nombreCompleto') or plan['nombre']} ({plan['etiqueta']})",
        "",
        " ".join(text for text in (plan["resumen"], plan.get("descripcion")) if text),
        "",
        f"Precio: {plan_prices(plan)}.",
    ]
    if plan.get("formasDePago"):
        lines.append(f"Formas de pago: {plan['formasDePago']}")
    # The full list if there is one; if not, the website's short one.
    includes = [
        f"{item['titulo']}: {item['texto']}" if item.get("texto") else item["titulo"] for item in plan.get("incluye", [])
    ] or plan.get("destacados", [])
    if includes:
        lines += ["", "Incluye:", *(f"- {item}" for item in includes)]
    for detail in plan.get("detalles", []):
        lines += ["", f"{detail['titulo']}:", *(f"- {point}" for point in detail["puntos"])]
    return "\n".join(lines)


def person(member: dict) -> str:
    name = f"{member['nombre']}, \"{member['apodo']}\"" if member.get("apodo") else member["nombre"]
    about = " ".join(text for text in (member["bio"], member.get("certificaciones")) if text)
    return f"- {name} ({member['rol']}): {about}"


def career() -> str:
    """Ronald's awards and press."""
    awards = [f"- {award['fecha']}: {award['titulo']}. {award['texto']}" for award in CAREER["premios"]]
    press = [
        f"- {item.get('destacadoEnInicio') or item['medio']} ({item['tipo']}): {item['titulo']}" for item in CAREER["prensa"]
    ]
    return "\n".join(["Premios y reconocimientos:", *awards, "", "En los medios:", *press])


def placeholders() -> dict[str, str]:
    address = GYM["direccion"]
    ronald = next((member for member in TEAM if member["id"] == "ronald"), {})
    return {
        "{{DIAS}}": days(),
        "{{DIAS_CERRADO}}": closed_days(),
        "{{HORAS_DE_INGRESO}}": start_times(),
        # 'las 11:00 y a las 20:00'
        "{{ULTIMOS_INGRESOS}}": " y a ".join(f"las {clock(shift['ultimoIngreso'])}" for shift in SHIFTS),
        "{{EJEMPLO_FUERA_DE_HORARIO}}": example_outside_hours(),
        "{{TURNOS}}": shifts(),
        "{{DURACION_DE_LA_CLASE}}": class_length(),
        "{{GIMNASIO}}": GYM["gimnasio"],
        "{{BARRIO}}": address["barrio"],
        "{{DIRECCION}}": f"{address['calle']}, {address['barrio']}, {address['ciudad']}",
        # '11 2733-6258', as it's dialed from Argentina.
        "{{WHATSAPP}}": GYM["whatsapp"].removeprefix("+54 9 "),
        "{{WHATSAPP_INTERNACIONAL}}": GYM["whatsapp"],
        "{{EMAIL}}": GYM["email"],
        "{{SITIO_WEB}}": GYM["sitioWeb"],
        "{{INSTAGRAM_DEL_GIMNASIO}}": GYM["instagram"],
        "{{INSTAGRAM_DE_RONALD}}": ronald.get("instagram", ""),
        "{{OTRAS_REDES}}": join([social["red"] for social in GYM["redes"] if social["red"] != "Instagram"]),
        "{{DESCRIPCION}}": plain(TEXTS["inicio"]["descripcion"]),
        "{{LEMA}}": TEXTS["lema"],
        "{{INTRODUCCION_EQUIPO}}": TEXTS["equipo"]["introduccion"],
        "{{SOBRE_RONALD}}": "\n".join(
            [*(f"- {plain(paragraph)}" for paragraph in TEXTS["elZar"]["parrafos"]), f'- En sus palabras: "{TEXTS["elZar"]["cita"]}"']
        ),
        "{{TRAYECTORIA}}": career(),
        "{{PLANES_RESUMEN}}": "\n".join(f"- {plan['nombre']} ({plan['etiqueta']}): {plan_prices(plan)}." for plan in PLANS),
        "{{PLANES}}": "\n\n".join(plan_section(plan) for plan in PLANS),
        "{{PREGUNTAS}}": "\n".join(f"- {faq['pregunta']} {faq['respuesta']}" for faq in FAQS),
        "{{EQUIPO}}": "\n".join(person(member) for member in TEAM),
    }


def fill(text: str) -> str:
    """The text with its {{PLACEHOLDERS}} filled in from db/. Fails on an unknown one, so a typo doesn't reach the model."""
    for placeholder, value in placeholders().items():
        text = text.replace(placeholder, value)
    if unknown := re.findall(r"\{\{\w+\}\}", text):
        raise RuntimeError(f"Unknown placeholders: {', '.join(sorted(set(unknown)))}. See db.placeholders().")
    return text
