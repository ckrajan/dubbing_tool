import spacy
from lemminflect import getAllLemmas
import re
import nltk
from nltk.corpus import wordnet
# nltk.download('wordnet')
# nltk.download('omw-1.4')

nlp = spacy.load("en_core_web_sm")
transcript =  "Hi everyone. This is a song for monkey. I don't have a background in economics and a Master's in Health, economic Policy and management. I went to this country a year ago I was looking forward to focus on health data management. So I did a few consulting here and then and I was like stick on this program. I did some research myself and after few reviews and testimonies from the program it proved quite useful and improved quite handy because a conventional university university will give you the curious knowledge. But then am I come lacking in this queue said that is tailored towards the job market. But this program gives you both the geographical and the practical, the hands on experience which sets you on stage for the job market. Alright so far this program has been beat a sweet some sexual sweet easy going. You had it at the click and some sections were tough. I had to put in more time go some days with Leslie. So I wrapped my head around the concept that was being taught. Now it gets into I. B. B. C. Success to me or mean to keep up the good work because now it gets tricky. I don't have a reminder to turn in an assignment on this date. Now that reminds me I need to remind myself what my mojo is, what my goal is and that's them that for me success like the efforts the steps you make towards achieving a goal will communicate to success and that is backed up by the driving force that is backed up by the commitment that is backed up by discipline, and I intend to keep all of that throughout this program, it might get tough, but quitting is not an option. If you fall down, you wake up and you keep moving. So I intend to keep that throughout this program. Thank you very much."

positive_words = ['able', 'abundant', 'accepting', 'accomplished', 'accurate', 'achiever', 'active', 'adaptable', 'adept', 'admirable', 'admired', 'adoptive', 'adorable', 'adventurous', 'affection', 'affectionate', 'affluent', 'agreeable', 'alert', 'aligned', 'alive', 'amazing', 'ambitious', 'amusement', 'analytical', 'appealing', 'appreciate', 'articulate', 'artistic', 'assertive', 'astounding', 'astute', 'attentive', 'attractive', 'auspicious', 'authentic', 'awake', 'aware', 'awesome', 'balanced', 'beaming', 'beautiful', 'best', 'blessed', 'bliss', 'blithesome', 'bold', 'bright', 'brilliant', 'brisk', 'broad-minded', 'buoyant', 'calm', 'candid', 'capable', 'careful', 'caring', 'cautious', 'centered', 'certain', 'changeable', 'charming', 'cheerful', 'childlike', 'clear', 'clear-thinking', 'clever', 'committed', 'communicative', 'compassionate', 'competent', 'competitive', 'complete', 'confident', 'connected', 'conscientious', 'conscious', 'consciousness', 'considerate', 'consistent', 'constructive', 'content', 'controversial', 'convenient', 'cooperative', 'courage', 'courageous', 'creative', 'curious', 'customary', 'daring', 'dazzling', 'delicious', 'delight', 'delightful', 'dependable', 'desirable', 'determined', 'devoted', 'diligent', 'diplomatic', 'direct', 'discerning', 'discover', 'dynamic', 'eager', 'easy', 'easy going', 'efficient', 'effortless', 'elation', 'elegant', 'eloquent', 'emotional', 'empathetic', 'empathy', 'endless', 'energetic', 'engaging', 'enhancer', 'enormous', 'enterprise', 'enterprising', 'enthusiastic', 'enticing', 'excellent', 'excellent', 'exceptional', 'excitement', 'exciting', 'experienced', 'exquisite', 'fabulous', 'fabulous', 'facilitator', 'fair', 'fair-minded', 'faithful', 'fantastic', 'farewell', 'fascinating', 'fast', 'favorable', 'fine', 'fit', 'flattering', 'flexible', 'flourishing', 'focused', 'forgiving', 'fortuitous', 'fortunate', 'free', 'friendliness', 'friendly', 'fulfilled', 'fun', 'funny', 'generous', 'gentle', 'genuine', 'gifted', 'glad', 'glorious', 'glowing', 'good', 'listener', 'natural', 'good-looking', 'gorgeous', 'graceful', 'gracious', 'grand', 'great', 'great', 'green', 'growing', 'handsome', 'happiness', 'happy', 'hard worker', 'hardworking', 'hardy', 'harmonious', 'healed', 'healthy', 'helpful', 'honest', 'hope', 'hopeful', 'humorous', 'ideal', 'idealistic', 'imaginative', 'impressive', 'incredible', 'incredible', 'independent', 'individual', 'individualistic', 'industrious', 'ineffable', 'informal', 'ingenious', 'initiator', 'innovative', 'insightful', 'inspired', 'intelligent', 'intense', 'interest', 'interested', 'interesting', 'intuitive', 'inventive', 'invincible', 'inviting', 'irresistible', 'joy', 'joyous', 'judicious', 'keen', 'kind', 'knowing', 'knowledgeable', 'leader', 'learning', 'leisurely', 'light-hearted', 'likable', 'limitless', 'literate', 'lively', 'logical', 'lovable', 'love', 'loving', 'loyal', 'lucky', 'luminous', 'magical', 'magnificent', 'marvellous', 'masterful', 'mature', 'mediator', 'meditative', 'merry', 'methodical', 'mighty', 'mild', 'miraculous', 'mirthful', 'moderate', 'modest', 'motivated', 'natural', 'neat', 'nice', 'noble', 'nonjudgmental', 'nurture', 'objective', 'open-minded', 'optimistic', 'organized', 'original', 'outgoing', 'outstanding', 'outstanding', 'particular', 'passionate', 'patient', 'peaceful', 'perceptive', 'perfect', 'perfect', 'persevering', 'persistent', 'personable', 'persuasive', 'playful', 'pleasant', 'pleasing', 'pleasure', 'plentiful', 'polite', 'politeness', 'political', 'positive', 'powerful', 'practical', 'precious', 'precise', 'prepared', 'pride', 'proactive', 'productive', 'professional', 'profound', 'progressive', 'prompt', 'propitious', 'prosperous', 'proud', 'punctual', 'qualified', 'quality', 'quick', 'quiet', 'quirky', 'quixotic', 'racy', 'radiant', 'rational', 'realistic', 'reasonable', 'rebellious', 'refined', 'reflective', 'refreshing', 'relaxed', 'relaxing', 'reliable', 'relieved', 'remarkable', 'remarkable', 'resolute', 'resourceful', 'respected', 'respectful', 'responsible', 'result', 'resultant', 'rewarding', 'robust', 'safe', 'satisfaction', 'satisfied', 'secure', 'seductive', 'self-disciplined', 'self-determination', 'sensational', 'sense of humor', 'sensible', 'sensitive', 'sensuous', 'serene', 'sharing', 'sincere', 'skilful', 'skilled', 'smart', 'smashing', 'smooth', 'sociable', 'self-consciousness', 'solid', 'sophisticated', 'sparkling', 'special', 'spectacular', 'spiritual', 'splendid', 'spontaneous', 'sporty', 'spunky', 'stable', 'stellar', 'strong', 'stunning', 'stupendous', 'successful', 'super', 'superb', 'surprised', 'swift', 'tactful', 'talented', 'tenacious', 'terrific', 'thankful', 'thorough', 'thoughtful', 'thrilling', 'thriving', 'timely', 'tolerant', 'traditional', 'trust', 'trusting', 'trustworthy', 'truthful', 'ultimate', 'unbelievable', 'unconventional', 'understanding', 'uninhabited', 'unique', 'unselfish', 'upbeat', 'valiant', 'valuable', 'versatile', 'vibrant', 'victorious', 'vigorous', 'vivacious', 'vivid', 'warm', 'wealthy', 'well', 'whole', 'wise', 'integrity', 'witty', 'wonderful', 'wondrous', 'worthy', 'youthful', 'zeal', 'zest', 'veritable']
negative_words = ['blunder', 'flounder', 'deteriorate', 'wane', 'abate', 'ebb', 'slacken', 'dwindle', 'drop', 'decrease', 'fade', 'decline', 'wither', 'dim', 'erroneous', 'accident', 'subside', 'dawdle', 'dilatory', 'idle', 'indolent', 'inert', 'lackadaisical', 'laggard', 'languid', 'leisurely', 'lethargic', 'loiter', 'slothful', 'sluggish', 'stagnant', 'torpid', 'detrimental', 'pernicious', 'insidious', 'precarious', 'exacerbate', 'aggravate', 'fallacious', 'deceptive', 'abhor', 'loathe', 'infelicitous', 'virulence', 'curtail', 'spat', 'feud', 'altercation', 'erupt', 'orchestrate', 'rage', 'estranged', 'slothful', 'rival', 'subtle', 'tirade', 'ostensible', 'apocryphal', 'purport', 'bog', 'thwart', 'meager', 'dearth', 'scarcity', 'skimp', 'gaffe', 'ignominious', 'infamy', 'disdain', 'profane', 'deride', 'disparage', 'denigrate', 'defame', 'demean', 'vituperate', 'vilify', 'denounce', 'intransigent', 'impervious', 'fawning', 'austerity', 'obnoxious', 'rife', 'pilfer', 'fence', 'destitution', 'squander', 'plight', 'exasperating', 'lamentable', 'abet', 'awful', 'rubble', 'seamy', 'vandalism', 'discountenance', 'impish', 'mayhem', 'palaver', 'abnegate', 'seethe', 'contaminate', 'perpetrate', 'drought', 'feign', 'fallacious', 'seclude', 'vicious', 'indignant', 'peril', 'imperil', 'banish', 'defy', 'apostate', 'deplore', 'hoax', 'farcical', 'fend', 'contrived', 'affectation', 'uncongenial', 'avaricious', 'devour', 'voracious', 'insatiable', 'antagonize', 'weary', 'infatuation', 'repugnance', 'dubious', 'ostentatiously', 'satire', 'lewd', 'mendacity', 'audacity', 'vivacity', 'veracity', 'felicity', 'tenacity', 'ferocity', 'duplicity', 'restive', 'petulance', 'spurious', 'specious', 'subvert', 'extirpate', 'ordeal', 'plight', 'scorn', 'stagnation', 'frivolous', 'spurn', 'surmise', 'daunt', 'confide', 'exodus', 'despondent', 'bigot', 'abysmal', 'adverse', 'alarming', 'angry', 'annoy', 'anxious', 'apathy', 'appalling', 'atrocious', 'awful', 'bad', 'banal', 'barbed', 'belligerent', 'bemoan', 'beneath', 'boring', 'broken', 'callous', 'clumsy', 'coarse', 'cold', 'collapse', 'confused', 'contradictory', 'contrary', 'corrosive', 'corrupt', 'coward', 'crazy', 'creep', 'criminal', 'cruel', 'cry', 'cutting', 'damage', 'dastardly', 'dead', 'decay', 'deform', 'deny', 'deplorable', 'depressed', 'deprived', 'despicable', 'detrimental', 'dirty', 'disease', 'disgusting', 'disheveled', 'dishonest', 'dishonorable', 'dismal', 'distress', 'dreadful', 'dreary', 'enraged', 'erode', 'evil', 'fail', 'fat', 'faulty', 'fear', 'feeble', 'fight', 'filthy', 'foul', 'frighten', 'frightfully', 'gawky', 'ghastly', 'grave', 'greed', 'grim', 'grimace', 'gross', 'grotesque', 'gruesome', 'guilty', 'haggard', 'hard', 'harmful', 'hate', 'hideous', 'homely', 'horrendous', 'horrible', 'hostile', 'hurt', 'hurtful', 'icky', 'idiot', 'ignorant', 'ignore', 'ill', 'immature', 'imperfect', 'impossible', 'inane', 'inelegant', 'infernal', 'injure', 'injurious', 'insane', 'insidious', 'insipid', 'jealous', 'junky', 'kill', 'life', 'lose', 'louse', 'lump', 'malicious', 'mean', 'menacing', 'messy', 'misshapen', 'missing', 'misunderstood', 'moan', 'moldy', 'monstrous', 'moron', 'naive', 'nasty', 'naughty', 'negate', 'negative', 'never', 'no', 'nobody', 'nondescript', 'nonsense', 'not', 'noxious', 'objectionable', 'odious', 'offensive', 'old', 'oppressive', 'pain', 'perturb', 'pessimistic', 'petty', 'pity', 'plain', 'poisonous', 'poor', 'prejudice', 'questionable', 'quirky', 'quit', 'reject', 'renege', 'repellant', 'reptilian', 'repugnant', 'repulsive', 'revenge', 'revolting', 'rocky', 'rotten', 'rude', 'ruthless', 'sad', 'savage', 'scare', 'scary', 'scream', 'severe', 'shocking', 'shoddy', 'sick', 'sickening', 'sinister', 'slimy', 'smelly', 'sob', 'sorry', 'spiteful', 'stab', 'sticky', 'stink', 'stormy', 'stressful', 'stuck', 'stupid', 'substandard', 'suspect', 'suspicious', 'tense', 'terrible', 'terrify', 'threaten', 'torture', 'ugly', 'undermine', 'fair', 'favorable', 'unhappy', 'healthy', 'unintelligent', 'unjust', 'unlucky', 'pleasant', 'satisfactory', 'unsightly', 'untoward', 'unwanted', 'unwelcome', 'wholesome', 'unwieldy', 'wise', 'upset', 'vice', 'vicious', 'vile', 'villainous', 'vindictive', 'wary', 'weary', 'wicked', 'woeful', 'worthless', 'wound', 'yell', 'yucky', 'zero']
            
pos_set = set()
neg_set = set()
transcript_set = set()

for split in positive_words:
    str_1 = str(list(getAllLemmas(split).values()))
    str_2 = str_1.lower().replace('(','').replace('),','').replace(',)','').replace('[','').replace(']','').replace(',','').replace(']','').replace('\'','')
    new_set = set(str_2.split(" "))
    pos_set.update(new_set)

teststr = str(pos_set)
pos_res = re.sub(r'[^\w\s]', '', teststr).lstrip(' ')
# print(pos_res)


for split in negative_words:
    str_1 = str(list(getAllLemmas(split).values()))
    str_2 = str_1.lower().replace('(','').replace('),','').replace(',)','').replace('[','').replace(']','').replace(',','').replace(']','').replace('\'','')
    new_set = set(str_2.split(" "))
    neg_set.update(new_set)

teststr = str(neg_set)
neg_res = re.sub(r'[^\w\s]', '', teststr).lstrip(' ')
# print(neg_res)


for split in transcript.split():
    str_1 = str(list(getAllLemmas(split).values()))
    str_2 = str_1.lower().replace('(','').replace('),','').replace(',)','').replace('[','').replace(']','').replace(',','').replace(']','').replace('\'','')
    new_list = set(str_2.split(" "))
    transcript_set.update(new_list)

teststr = str(transcript_set)
transcript_res = re.sub(r'[^\w\s]', '', teststr).lstrip(' ')
# print(transcript_res)

positive_words_used = []
negative_words_used = []

for x in pos_res.split(" "):
    for y in transcript_res.split(" "):
        if(x == y):
            positive_words_used.append(y)
                        
for a in neg_res.split(" "):
    for b in transcript_res.split(" "):
        if(a == b):
            negative_words_used.append(b)
            
pos_words = str(' '.join(positive_words_used)).replace(" ", ", ")
neg_words = str(' '.join(negative_words_used)).replace(" ", ", ")
            
print("Postive words used: " + pos_words)     
print("Negative words used: " + neg_words)



antonyms = []

for syn in wordnet.synsets("quit"):
    for i in syn.lemmas():
         if i.antonyms():
              antonyms.append(i.antonyms()[0].name())

print(set(antonyms))

