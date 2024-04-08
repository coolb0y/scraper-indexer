# Python3 program to illustrate 
# accessing of video metadata 
# using tinytag library 

# Import Tinytag method from 
# tinytag library 
from tinytag import TinyTag 
import sys

# Check if a command line argument has been provided
if len(sys.argv) > 1:
    videoPath = sys.argv[1]  # Get the file path from command line arguments
else:
    sys.exit(1)  # Exit the script if no argument is provided

# Try to access the video metadata
try:
    # Pass the filename into the Tinytag.get() method and store the result in video variable 
    video = TinyTag.get(videoPath) 

    # Use the attributes 
    print(video)
except Exception:
    pass  # Silently handle any errors
