import os

# 1. Delete the insecure/unused blob upload route (we use Server Actions now)
# This removes a potential attack vector.
if os.path.exists("app/api/blob/upload/route.ts"):
    os.remove("app/api/blob/upload/route.ts")
    print("Removed insecure route: app/api/blob/upload/route.ts")

# 2. Remove the folder if empty
if os.path.exists("app/api/blob/upload"):
    try:
        os.rmdir("app/api/blob/upload")
    except:
        pass # Folder not empty