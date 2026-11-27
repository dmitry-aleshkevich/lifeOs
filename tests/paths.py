# где лежит репозиторий: по умолчанию папка над tests/, можно переопределить LO_ROOT
import os, pathlib
ROOT = pathlib.Path(os.environ.get("LO_ROOT") or pathlib.Path(__file__).resolve().parent.parent)
URL = ROOT.as_uri()
