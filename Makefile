CROSS_COMPILE ?=
CC      = $(CROSS_COMPILE)gcc
CFLAGS  = -Wall -g -pthread
LDFLAGS   = -pthread 
LOADLIBES = -lrt -lm

EXERCISES=		\
daemon			\

.PHONY: all
all : ${EXERCISES}

.PHONY: clean
clean : 
	@rm -f core *.o *.out *.bb *.bbg *.gcov *.da *~
	@rm -f ${EXERCISES}

