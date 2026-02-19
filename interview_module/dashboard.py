from __future__ import annotations

import sys
from dataclasses import dataclass
from typing import Dict

from stress_model import StressScore


@dataclass
class Dashboard:
    verbose: bool = False

    def render(self, features: Dict[str, float], stress: StressScore) -> None:
        if self.verbose:
            sys.stdout.write("\033[2J\033[H")  # simple terminal clear
        lines = [stress.formatted()]
        for name, value in features.items():
            if isinstance(value, (int, float)):
                lines.append(f"{name}: {value:.3f}")
            else:
                lines.append(f"{name}: {value}")
        output = "\n".join(lines)
        if self.verbose:
            print(output)
        else:
            sys.stdout.write("\r" + output.replace("\n", " | "))
            sys.stdout.flush()
