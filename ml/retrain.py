"""Scheduled retraining with a safety gate.  Run weekly (cron / Windows Task Scheduler):  python retrain.py
Trains to a temporary file, checks interval coverage on the walk-forward test, and only then replaces
the live model. Keeps a dated copy of the metrics so drift is visible over time."""
import json, os, shutil, subprocess, sys, time

LIVE, NEW, MET = "vol_model.joblib", "vol_model.new.joblib", "vol_metrics.new.json"


def main():
    subprocess.run([sys.executable, "vol.py", "--out", NEW, "--metrics", MET], check=True)
    rep = json.load(open(MET))
    cov = rep["interval"]["coverage"]
    os.makedirs("history", exist_ok=True)
    shutil.copy(MET, f"history/vol_metrics_{time.strftime('%Y%m%d')}.json")
    if not 0.74 <= cov <= 0.86:
        print(f"REJECTED: coverage {cov:.3f} outside 0.74-0.86. Keeping the current model.")
        sys.exit(1)
    shutil.move(NEW, LIVE)
    shutil.move(MET, "vol_metrics.json")
    print(f"Updated live model (coverage {cov:.3f}).")


if __name__ == "__main__":
    main()
