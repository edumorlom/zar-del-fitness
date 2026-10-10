"""Dates in Spanish, as the assistant says them and the gym reads them in booking emails."""

import datetime

WEEKDAYS = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"]
MONTHS = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
]


def spanish_date(day: datetime.date, with_year: bool = False) -> str:
    """'lunes 12 de octubre', or 'lunes 12 de octubre de 2026' with the year."""
    text = f"{WEEKDAYS[day.weekday()]} {day.day} de {MONTHS[day.month - 1]}"
    return f"{text} de {day.year}" if with_year else text
