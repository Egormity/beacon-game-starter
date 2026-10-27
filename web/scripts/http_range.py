"""A single HTTP byte range for native browser video seeking."""

import re


def parse_range(value: str, size: int) -> tuple[int, int]:
    match = re.fullmatch(r"bytes=(\d*)-(\d*)", value.strip())
    if not match or size <= 0:
        raise ValueError("Unsatisfiable range")
    first, last = match.groups()
    if not first:
        if not last or int(last) <= 0:
            raise ValueError("Unsatisfiable suffix range")
        return max(0, size - int(last)), size - 1
    start = int(first)
    end = min(int(last), size - 1) if last else size - 1
    if start >= size or end < start:
        raise ValueError("Unsatisfiable range")
    return start, end
