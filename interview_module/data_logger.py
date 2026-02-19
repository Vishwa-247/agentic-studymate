from __future__ import annotations

import csv
import pathlib
import time
from dataclasses import dataclass, field
from typing import Dict, Iterable


@dataclass
class DataLogger:
    output_path: pathlib.Path
    fieldnames: Iterable[str]
    append: bool = True
    _writer: csv.DictWriter | None = field(init=False, default=None)
    _file: object | None = field(init=False, default=None)

    def __post_init__(self) -> None:
        self.output_path.parent.mkdir(parents=True, exist_ok=True)
        mode = "a" if self.append else "w"
        self._file = self.output_path.open(mode, newline="")
        self._writer = csv.DictWriter(self._file, fieldnames=["timestamp", *self.fieldnames])
        if not self.append or self.output_path.stat().st_size == 0:
            self._writer.writeheader()

    def log(self, metrics: Dict[str, float]) -> None:
        assert self._writer is not None
        row = {name: metrics.get(name) for name in self.fieldnames}
        row["timestamp"] = time.time()
        self._writer.writerow(row)
        self._file.flush()  # type: ignore[union-attr]

    def close(self) -> None:
        if self._file is not None:
            self._file.close()
            self._file = None
            self._writer = None

    def __enter__(self) -> "DataLogger":
        return self

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        self.close()
