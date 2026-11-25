import asyncio, time
from aiosmtpd.controller import Controller
class H:
    async def handle_DATA(self, server, session, env):
        open(f"/tmp/mail/{time.time():.6f}_{env.rcpt_tos[0]}.eml","wb").write(env.content); return '250 OK'
c=Controller(H(), hostname='127.0.0.1', port=2500); c.start()
asyncio.get_event_loop().run_forever()
