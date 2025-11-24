PROVIDER_MODELS = {
    "OpenAI": [
        "gpt-5.1",
        "gpt-5",
        "gpt-5-nano",
        "gpt-5-mini",
        "gpt-4o",
        "gpt-4.1",
        "gpt-4o-mini",
        "o4-mini",
        "o3",
        "o3-mini",
        "o1",
        "gpt-4.1-nano",
    ],
    "Anthropic": [
        "claude-sonnet-4-5",
        "claude-haiku-4-5",
        "claude-opus-4-1",
    ],
    "Google": [
        "gemini-2.5-pro",
        "gemini-2.5-flash",
    ],
    "Groq": [
        "openai/gpt-oss-120b",
        "llama-3.3-70b-versatile",
        "meta-llama/llama-4-scout-17b-16e-instruct",
        "moonshotai/kimi-k2-instruct",
        "moonshotai/kimi-k2-instruct-0905",
        "llama-3.1-8b-instant",
        "groq/compound",
        "groq/compound-mini",
    ],
    "OpenRouter": [
        "deepseek/deepseek-r1-distill-llama-70b",
        "deepseek/deepseek-r1-distill-llama-70b",
        "deepseek/deepseek-r1:free",
        "deepseek/deepseek-r1",
        "deepseek/deepseek-chat",
        "qwen/qwen3-235b-a22b-2507",
        "moonshotai/kimi-k2",
        "x-ai/grok-4",
        "x-ai/grok-3",
        "tencent/hunyuan-a13b-instruct",
    ],
    "Mistral": [
        "mistral-small",
        "codestral-latest",
    ],
    "Nvidia": [
        "meta/llama-3.1-405b-instruct",
        "meta/llama-3.1-70b-instruct",
        "meta/llama-3.1-8b-instruct",
        "nv-mistralai/mistral-nemo-12b-instruct",
        "mistralai/mixtral-8x22b-instruct-v0.1",
        "mistralai/mistral-large-2-instruct",
        "nvidia/nemotron-4-340b-instruct",
    ],
}


def get_provider_for_model_name(model_name: str) -> str | None:
    for provider, models in PROVIDER_MODELS.items():
        if model_name in models:
            return provider

    if model_name.startswith(("gpt", "o1", "o3", "o4")):
        return "OpenAI"
    if model_name.startswith("claude"):
        return "Anthropic"
    if model_name.startswith("gemini"):
        return "Google"
    if model_name.startswith(("openai/", "llama-3.", "groq/")):
        return "Groq"
    if "/" in model_name and any(model_name.startswith(p) for p in ("deepseek/", "qwen/", "x-ai/", "moonshotai/", "tencent/")):
        return "OpenRouter"
    if model_name in ("mistral-small", "codestral-latest"):
        return "Mistral"
    if model_name.startswith(("meta/", "mistralai/", "nv-mistralai", "nvidia/")):
        return "Nvidia"

    return None
