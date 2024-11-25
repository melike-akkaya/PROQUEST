import subprocess
import sys

def install(package):
    subprocess.check_call([sys.executable, "-m", "pip", "install", package])

def main():
    packages = [
        "streamlit",
        "requests",
        "langchain_openai",
        "langchain_google_genai",
        "langchain_anthropic",
        "langchain_nvidia_ai_endpoints",
        "langchain",
        "scikit-learn",
        "langchain_mistralai"
    ]

    for package in packages:
        try:
            __import__(package.split()[0])
            print(f"{package} is already installed.")
        except ImportError:
            print(f"Installing {package}...")
            install(package)
            print(f"{package} installed successfully.")

if __name__ == "__main__":
    main()
