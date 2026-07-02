from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from app.services.news_service import collect_since_yesterday

_scheduler: BackgroundScheduler | None = None


def start_scheduler() -> None:
    global _scheduler
    if _scheduler is not None and _scheduler.running:
        return

    _scheduler = BackgroundScheduler(timezone="Asia/Seoul")
    _scheduler.add_job(
        collect_since_yesterday,
        CronTrigger(hour=9, minute=0, timezone="Asia/Seoul"),
        id="daily-policy-news-collection",
        replace_existing=True,
        max_instances=1,
    )
    _scheduler.start()
