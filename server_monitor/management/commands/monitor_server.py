from __future__ import annotations

import time

from django.core.management.base import BaseCommand

from server_monitor.services import ServerMonitorService


class Command(BaseCommand):
    help = "Continuously monitor server health and send alerts on changes."

    def add_arguments(self, parser):
        parser.add_argument("--once", action="store_true", help="Run checks once and exit.")
        parser.add_argument("--interval", type=int, default=None, help="Check interval in seconds.")
        parser.add_argument("--no-notify", action="store_true", help="Do not send notifications.")
        parser.add_argument("--no-persist", action="store_true", help="Do not persist monitor state.")

    def handle(self, *args, **options):
        service = ServerMonitorService()
        notify = not options["no_notify"]
        persist_state = not options["no_persist"]
        interval = options["interval"]

        if interval is None:
            interval = int(service.config.get("CHECK_INTERVAL_SECONDS", 30) or 30)
        interval = max(5, interval)

        if options["once"]:
            report = service.run(notify=notify, persist_state=persist_state)
            self.stdout.write(self.style.SUCCESS(f"status={report.status} checks={len(report.checks)} alerts={len(report.alerts)}"))
            return

        self.stdout.write(self.style.WARNING(f"Server monitor started. interval={interval}s"))
        try:
            while True:
                report = service.run(notify=notify, persist_state=persist_state)
                self.stdout.write(f"status={report.status} checks={len(report.checks)} alerts={len(report.alerts)}")
                self.stdout.flush()
                time.sleep(interval)
        except KeyboardInterrupt:
            self.stdout.write(self.style.WARNING("Server monitor stopped."))
