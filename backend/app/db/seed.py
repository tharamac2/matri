"""Seed the database with sample data for local development.

Run with: python -m app.db.seed
"""
import random
from datetime import date, datetime, timedelta

from app.core.security import hash_password
from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.models import (
    AdminRole,
    AdminUser,
    Gender,
    Match,
    MatchStatus,
    Member,
    MemberStatus,
    Payment,
    PaymentStatus,
    PhotoStatus,
    Profile,
    Report,
    ReportStatus,
    Subscription,
    SubscriptionPlan,
    SubscriptionStatus,
)

random.seed(42)

FIRST_NAMES = [
    "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Krishna",
    "Ishaan", "Rohan", "Ananya", "Diya", "Saanvi", "Aadhya", "Kavya", "Myra",
    "Aanya", "Pari", "Riya", "Ira", "Karthik", "Nikhil", "Sandeep", "Pooja",
    "Sneha", "Divya", "Meera", "Priya", "Rahul", "Anjali",
]
LAST_NAMES = [
    "Sharma", "Verma", "Iyer", "Nair", "Reddy", "Gupta", "Patel", "Kumar",
    "Menon", "Rao", "Pillai", "Joshi", "Shah", "Mehta", "Singh", "Das",
]
RELIGIONS = ["Hindu", "Muslim", "Christian", "Sikh", "Jain", "Buddhist"]
CASTES = ["Brahmin", "Kshatriya", "Vaishya", "Nair", "Reddy", "Iyer", "Other"]
CITIES = [
    ("Bengaluru", "Karnataka"), ("Chennai", "Tamil Nadu"), ("Mumbai", "Maharashtra"),
    ("Hyderabad", "Telangana"), ("Pune", "Maharashtra"), ("Delhi", "Delhi"),
    ("Kochi", "Kerala"), ("Coimbatore", "Tamil Nadu"),
]
EDUCATION = ["B.Tech", "M.Tech", "MBA", "B.Com", "M.Sc", "MBBS", "B.A.", "CA"]
PROFESSIONS = [
    "Software Engineer", "Doctor", "Teacher", "Chartered Accountant",
    "Business Analyst", "Architect", "Civil Engineer", "Designer", "Lawyer",
]
GATEWAYS = ["razorpay", "stripe", "payu", "cashfree"]
REPORT_REASONS = [
    "Fake profile", "Inappropriate photos", "Abusive messages",
    "Suspected scam", "Duplicate account", "Harassment",
]


def _random_dob() -> date:
    start = date(1985, 1, 1)
    end = date(2002, 12, 31)
    delta_days = (end - start).days
    return start + timedelta(days=random.randint(0, delta_days))


def seed() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        if db.query(AdminUser).count() > 0:
            print("Database already seeded — skipping.")
            return

        # 1. Admin users
        super_admin = AdminUser(
            name="Asha Admin",
            email="superadmin@matrimonyadmin.com",
            password_hash=hash_password("SuperAdmin@123"),
            role=AdminRole.super_admin,
            is_active=True,
        )
        moderator = AdminUser(
            name="Mohan Moderator",
            email="moderator@matrimonyadmin.com",
            password_hash=hash_password("Moderator@123"),
            role=AdminRole.moderator,
            is_active=True,
        )
        db.add_all([super_admin, moderator])
        db.flush()

        # 2. Members
        members: list[Member] = []
        now = datetime.utcnow()
        for i in range(50):
            gender = Gender.male if i % 2 == 0 else Gender.female
            first = random.choice(FIRST_NAMES)
            last = random.choice(LAST_NAMES)
            city, state = random.choice(CITIES)
            created_at = now - timedelta(days=random.randint(0, 180))
            member = Member(
                name=f"{first} {last}",
                email=f"{first.lower()}.{last.lower()}{i}@example.com",
                phone=f"9{random.randint(100000000, 999999999)}",
                gender=gender,
                dob=_random_dob(),
                religion=random.choice(RELIGIONS),
                caste=random.choice(CASTES),
                city=city,
                state=state,
                status=random.choices(
                    list(MemberStatus),
                    weights=[70, 15, 5, 10],
                )[0],
                created_at=created_at,
                last_active=created_at + timedelta(days=random.randint(0, 60)),
            )
            members.append(member)
        db.add_all(members)
        db.flush()

        # 3. Profiles (30 of the 50 members)
        for member in random.sample(members, 30):
            profile = Profile(
                member_id=member.id,
                bio=f"Hi, I'm {member.name.split()[0]} looking for a meaningful connection.",
                height_cm=random.randint(150, 190),
                education=random.choice(EDUCATION),
                profession=random.choice(PROFESSIONS),
                income_lpa=round(random.uniform(3, 40), 1),
                photo_url=f"https://picsum.photos/seed/{member.id}/400/400",
                photo_status=random.choices(list(PhotoStatus), weights=[20, 70, 10])[0],
                partner_prefs={
                    "age_min": 22,
                    "age_max": 35,
                    "religion": random.choice(RELIGIONS),
                    "city": random.choice(CITIES)[0],
                },
            )
            db.add(profile)
        db.flush()

        # 4. Matches (20 between members)
        for _ in range(20):
            sender, receiver = random.sample(members, 2)
            sent_at = now - timedelta(days=random.randint(0, 90))
            match_status = random.choices(list(MatchStatus), weights=[40, 30, 20, 10])[0]
            db.add(
                Match(
                    sender_id=sender.id,
                    receiver_id=receiver.id,
                    status=match_status,
                    sent_at=sent_at,
                    responded_at=sent_at + timedelta(days=random.randint(1, 5))
                    if match_status != MatchStatus.pending
                    else None,
                )
            )

        # 5. Subscription plans
        free_plan = SubscriptionPlan(
            name="Free",
            price=0,
            duration_days=30,
            features={"matches_per_day": 5, "chat": False, "priority_support": False},
            is_active=True,
        )
        gold_plan = SubscriptionPlan(
            name="Gold",
            price=999,
            duration_days=90,
            features={"matches_per_day": 30, "chat": True, "priority_support": False},
            is_active=True,
        )
        platinum_plan = SubscriptionPlan(
            name="Platinum",
            price=2499,
            duration_days=180,
            features={"matches_per_day": 100, "chat": True, "priority_support": True},
            is_active=True,
        )
        plans = [free_plan, gold_plan, platinum_plan]
        db.add_all(plans)
        db.flush()

        # 6. Subscriptions (15)
        subscriptions: list[Subscription] = []
        subscribed_members = random.sample(members, 15)
        for member in subscribed_members:
            plan = random.choice(plans)
            start_date = (now - timedelta(days=random.randint(0, 120))).date()
            end_date = start_date + timedelta(days=plan.duration_days)
            sub_status = SubscriptionStatus.active if end_date >= date.today() else SubscriptionStatus.expired
            subscription = Subscription(
                member_id=member.id,
                plan_id=plan.id,
                start_date=start_date,
                end_date=end_date,
                status=sub_status,
                auto_renew=random.choice([True, False]),
            )
            subscriptions.append(subscription)
        db.add_all(subscriptions)
        db.flush()

        # 7. Payments (10, linked to paid subscriptions)
        paid_subscriptions = [s for s in subscriptions if s.plan_id != free_plan.id]
        for subscription in random.sample(paid_subscriptions, min(10, len(paid_subscriptions))):
            plan = next(p for p in plans if p.id == subscription.plan_id)
            db.add(
                Payment(
                    member_id=subscription.member_id,
                    subscription_id=subscription.id,
                    amount=plan.price,
                    gateway=random.choice(GATEWAYS),
                    txn_id=f"txn_{subscription.id}_{random.randint(100000, 999999)}",
                    status=random.choices(list(PaymentStatus), weights=[85, 10, 5])[0],
                    paid_at=datetime.combine(subscription.start_date, datetime.min.time()),
                )
            )

        # 8. Reports (8)
        for _ in range(8):
            reporter, reported = random.sample(members, 2)
            report_status = random.choices(list(ReportStatus), weights=[40, 20, 25, 15])[0]
            created_at = now - timedelta(days=random.randint(0, 60))
            db.add(
                Report(
                    reporter_id=reporter.id,
                    reported_id=reported.id,
                    reason=random.choice(REPORT_REASONS),
                    description="Reported via mobile app — auto-generated seed data.",
                    status=report_status,
                    reviewed_by=moderator.id if report_status != ReportStatus.pending else None,
                    created_at=created_at,
                    resolved_at=created_at + timedelta(days=random.randint(1, 5))
                    if report_status in (ReportStatus.resolved, ReportStatus.dismissed)
                    else None,
                )
            )

        db.commit()
        print("Seed complete:")
        print("  Admins: 2 (1 super_admin, 1 moderator)")
        print("  Members: 50 | Profiles: 30 | Matches: 20")
        print("  Plans: 3 | Subscriptions: 15 | Payments: ~10 | Reports: 8")
        print()
        print("Login with:")
        print("  superadmin@matrimonyadmin.com / SuperAdmin@123")
        print("  moderator@matrimonyadmin.com / Moderator@123")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
