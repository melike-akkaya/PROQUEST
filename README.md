To create the asset database:
python .\config\setupdatabase.py

To create the working environment:
python .\config\installpackages.py

To delete all previously installed libraries (in case of a problem):
pip freeze | %{$_.split('==')[0]} | %{pip uninstall -y $_}

To run the program:
streamlit run main.py

To get free API key for gemini-1.5-flash AND gemini-pro:
https://aistudio.google.com/prompts/new_chat

To get free API key for microsoft/phi-3.5-mini-instruct:
https://build.nvidia.com/microsoft/phi-3-mini-4k?snippet_tab=LangChain